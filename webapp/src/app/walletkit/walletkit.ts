import { IWalletKit, WalletKit, WalletKitTypes } from "@reown/walletkit";
import { Potato, publicKey } from "potato-sdk";
import { concat, computeAddress, getBytes, Signature, keccak256 } from "ethers";
import { BehaviorSubject, map, Observable, of } from "rxjs";
import { SessionTypes, SignClientTypes } from "@walletconnect/types";
import { buildApprovedNamespaces, getSdkError } from "@walletconnect/utils";
import { TransactionLike } from "ethers";

const SUPPORTED_METHODS = [
  'eth_sendTransaction',
  'personal_sign',
];

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
    console.log("Received WalletConnect session proposal:", proposal);

    // We support all eip155 chains (kind of).
    const chains = [];
    if (proposal.params.requiredNamespaces['eip155']?.chains) {
      chains.push(...proposal.params.requiredNamespaces['eip155'].chains);
    }
    if (proposal.params.optionalNamespaces['eip155']?.chains) {
      chains.push(...proposal.params.optionalNamespaces['eip155'].chains);
    }
    const approvedNamespaces = buildApprovedNamespaces({
      proposal: proposal.params,
      supportedNamespaces: {
        eip155: {
          chains,
          methods: SUPPORTED_METHODS,  // TODO: We should be supporting all requested methods.
          events: [], // TODO: We should be supporting all requested events.
          accounts: chains.map(chain => `${chain}:${this.address}`)
        }
      }
    })
    console.log('Approving session with', approvedNamespaces);
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
    // TODO: Change back to switch
    const method = event.params.request.method;
    if (!SUPPORTED_METHODS.includes(method)) {
      console.warn("Unsupported incoming WalletConnect request:", event.params.request);
      return;
    }
    if (method == 'wallet_switchEthereumChain') {
      await this.walletKit.respondSessionRequest({
        topic: event.topic,
        response: {
          id: event.id,
          jsonrpc: '2.0',
          result: null,
        }
      });
    } else {
      const session = this.sessions.get(event.topic);
      if (session) {
        session.addRequest(new PotatoConnectRequest(session, event));
      }
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

  get requestParams(): any {
    return this.sessionRequest.params.request.params;
  }

  get isPersonalSign(): boolean {
    return this.method === 'personal_sign';
  }

  get isTransaction(): boolean {
    return this.method === 'eth_sendTransaction';
  }

  get personalSignMessage(): string {
    // TODO: Support messages not encoded in UTF-8
    console.assert(this.isPersonalSign, "Not a personal_sign request");
    return new TextDecoder().decode(getBytes(this.requestParams[0]));
  }

  get transactionParams(): TransactionLike {
    return {
      ...this.requestParams[0],
      chainId: this.sessionRequest.params.chainId
    }
  }

  respond(result: any) {
    // TODO: Make sure we can only respond once?
    console.assert(this.isPersonalSign, "Not a personal_sign request");
    this.walletKit.respondSessionRequest({
      topic: this.session.topic,
      response: {
        id: this.sessionRequest.id,
        result,
        jsonrpc: "2.0"
      }
    });
  }
}
