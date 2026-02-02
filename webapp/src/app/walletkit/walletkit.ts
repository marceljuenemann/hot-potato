import { IWalletKit, WalletKit, WalletKitTypes } from "@reown/walletkit";
import { Potato, publicKey } from "potato-sdk";
import { concat, computeAddress, getBytes, Signature, keccak256 } from "ethers";
import { BehaviorSubject, map, Observable, of } from "rxjs";
import { SessionTypes, SignClientTypes } from "@walletconnect/types";
import { buildApprovedNamespaces, getSdkError } from "@walletconnect/utils";

export type DisconnectReason = {
  message: string;
  code: number;
};

/**
 * WalletConnect peer that acts as the wallet of a Potato.
 */
export class PotatoConnect {
  private sessions: SessionMap;
  private address: string;

  /**
   * @param walletKit an initialized WalletKit instance. No event listeners should be attached yet.
   * @param potato the Potato instance to imitate
   */
  constructor(
    public readonly walletKit: IWalletKit,
    public readonly potato: Potato,
  ) {
    this.address = computeAddress(publicKey(potato));
    this.walletKit.on('session_proposal', this.onSessionProposal.bind(this));
    this.walletKit.on('session_delete', this.onSessionDelete.bind(this));
    this.walletKit.on('session_request', this.onSessionRequest.bind(this));
    this.sessions = new SessionMap(this);
  }

  get sessions$(): Observable<Array<PotatoConnectSession>> {
    return this.sessions.sessions$.pipe(
      map(sessionMap => Array.from(sessionMap.values())),  // Defensive copy.
    );
  }

  /**
   * Handles incoming connection proposals by dapps.
   */
  private async onSessionProposal(proposal: WalletKitTypes.SessionProposal) {
    const approvedNamespaces = buildApprovedNamespaces({
      proposal: proposal.params,
      supportedNamespaces: {
        eip155: {
          // TODO: More chains?
          chains: ['eip155:1'],
          // TODO: Some more are needed, e.g. eth_getAccounts
          methods: ['eth_sendTransaction', 'personal_sign'],
          events: [], // ['accountsChanged', 'chainChanged'],
          accounts: [
            // TODO: Do we need to add more chains?
            `eip155:1:${this.address}`,
          ]
        }
      }
    })

    const session = await this.walletKit.approveSession({
      id: proposal.id,
      namespaces: approvedNamespaces,
    });
    this.sessions.add(session);
  }

  /**
   * Called when the peer disconnects.
   */
  private async onSessionDelete(proposal: WalletKitTypes.SessionDelete) {
    this.sessions.delete(proposal.topic);
  }

  /**
   * Handles requests from the peer, such as eth_signTransaction.
   */
  private async onSessionRequest(event: WalletKitTypes.SessionRequest) {
    const request = event.params.request;
    switch (request.method) {
      case 'personal_sign':
        const session = this.sessions.get(event.topic);
        if (session) {
          session.addRequest(new PotatoConnectRequest(session, event));
        }
        break;

      case 'eth_sendTransaction':
        console.log("Signing WalletConnect eth_sendTransaction:", request);
        break;

      default:
        console.warn("Unsupported WalletConnect request:", request);
        break;
    }
  }
}

/**
 * Wrapper around WalletKit session that holds additional state about
 * signature requests.
 */
export class PotatoConnectSession {
  /**
   * Incoming requests from the dapp. Note that unlike sessions, requests
   * are not persisted across page refreshes.
   */
  public readonly requests$ = new BehaviorSubject<PotatoConnectRequest[]>([]);

  constructor(
    public readonly potatoConnect: PotatoConnect,
    public readonly session: SessionTypes.Struct,
    public readonly disconnect: (reason?: DisconnectReason) => void
  ) {}

  get topic(): string {
    return this.session.topic;
  }

  get metadata(): SignClientTypes.Metadata {
    return this.session.peer.metadata
  }

  addRequest(request: PotatoConnectRequest) {
    const current = this.requests$.value;
    this.requests$.next([...current, request]);
  }
}

/**
 * Keeps track of all sessions and allows to observe changes.
 */
class SessionMap {
  private sessions = new Map<string, PotatoConnectSession>();
  public readonly sessions$ = new BehaviorSubject(this.sessions);

  constructor(public readonly potatoConnect: PotatoConnect) {
    for (const session of Object.values(this.potatoConnect.walletKit.getActiveSessions())) {
      this.sessions.set(session.topic, this.wrap(session));
    }
  }

  add(session: SessionTypes.Struct) {
    this.sessions.set(session.topic, this.wrap(session));
    this.sessions$.next(this.sessions);
  }

  get(topic: string): PotatoConnectSession | undefined {
    return this.sessions.get(topic);
  }

  delete(topic: string) {
    this.sessions.delete(topic);
    this.sessions$.next(this.sessions);
  }

  private wrap(session: SessionTypes.Struct): PotatoConnectSession {
    return new PotatoConnectSession(this.potatoConnect, session, (reason?: DisconnectReason) => {
      this.potatoConnect.walletKit.disconnectSession({
        topic: session.topic,
        reason: reason ?? getSdkError("USER_DISCONNECTED"),
      });
      this.delete(session.topic);
    });
  }
}

export class PotatoConnectRequest {
  public readonly receivedAt = Date.now();

  constructor(
    public readonly session: PotatoConnectSession,
    public readonly sessionRequest: WalletKitTypes.SessionRequest,
  ) {}

  get potato() {
    return this.session.potatoConnect.potato;
  }

  private get walletKit() {
    return this.session.potatoConnect.walletKit;
  }

  get chainId() {
    return this.sessionRequest.params.chainId;
  }

  get method() {
    return this.sessionRequest.params.request.method;
  }

  get expireTimestamp(): number | undefined {
    return this.sessionRequest.params.request.expiryTimestamp;
  }

  get params(): any {
    return this.sessionRequest.params.request.params;
  }

  get isPersonalSign(): boolean {
    return this.method === 'personal_sign';
  }

  get personalSignMessage(): string {
    // TODO: Support messages not encoded in UTF-8
    console.assert(this.isPersonalSign, "Not a personal_sign request");
    return new TextDecoder().decode(getBytes(this.params[0]));
  }

  hashToSign(): string {
    // TODO: Consider creating subclasses. Doesn't work well with angular templates though.
    if (this.isPersonalSign) {
      const msg = this.personalSignMessage;
      const data = "\x19Ethereum Signed Message:\n" + msg.length + msg;
      return keccak256(new TextEncoder().encode(data));
    }
    throw new Error("Unsupported request method: " + this.method);
  }

  respond(signature: Signature) {
    // TODO: Make sure we can only respond once?
    console.assert(this.isPersonalSign, "Not a personal_sign request");
    this.walletKit.respondSessionRequest({
      topic: this.session.topic,
      response: {
        id: this.sessionRequest.id,
        // TODO: This doesn't seem to work yet.
        result: signature.serialized,
        jsonrpc: "2.0"
      }
    });
  }
}
