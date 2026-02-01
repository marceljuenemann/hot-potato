import { IWalletKit, WalletKit } from "@reown/walletkit";
import { Potato } from "potato-sdk";
import { environment } from "../../environments/environment.development";
import { Core } from "@walletconnect/core";
import { BehaviorSubject, map, Observable, of } from "rxjs";
import { SessionTypes, SignClientTypes } from "@walletconnect/types";
import { getSdkError } from "@walletconnect/utils";

export type DisconnectReason = {
  message: string;
  code: number;
};

/**
 * WalletConnect peer that acts as the wallet of a Potato.
 */
export class PotatoConnect {
  private sessions;

  /**
   * @param walletKit an initialized WalletKit instance. No event listeners should be attached yet.
   * @param potato the Potato instance to immitate
   */
  constructor(
    public readonly walletKit: IWalletKit,
    public readonly potato: Potato,
  ) {
    this.sessions = new SessionMap(walletKit);
  }

  get session$(): Observable<Array<PotatoConnectSession>> {
    return this.sessions.sessions$.pipe(
      map(sessionMap => Array.from(sessionMap.values())),  // Defensive copy.
    );
  }

  /*
    this.walletKit.on(
      "session_proposal",
      async (proposal: WalletKitTypes.SessionProposal) => {
        const approvedNamespaces = buildApprovedNamespaces({
          proposal: proposal.params,
          supportedNamespaces: {
            eip155: {
              // TODO: More chains
              chains: ['eip155:1', 'eip155:137'],
              methods: ['eth_sendTransaction', 'personal_sign'],
              events: [], // ['accountsChanged', 'chainChanged'],
              accounts: [
                // TODO: Set accounts.
                'eip155:1:0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb',
                'eip155:137:0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb'
              ]
            }
          }
        })

        const session = await this.walletKit!.approveSession({
          id: proposal.id,
          namespaces: approvedNamespaces,
        });

        // TODO: Update sessions
      }
    );

    this.walletKit.on(
      "session_request",
      async (event: WalletKitTypes.SessionRequest) => {
        const { topic, params, id } = event;
        const { request } = params;
        const requestParamsMessage = request.params[0];

        // convert `requestParamsMessage` by using a method like hexToUtf8
        const message = new TextDecoder().decode(getBytes(requestParamsMessage));

        // sign the message
        console.log ("Signing WalletConnect message:", message);
        // const signedMessage = await this.wallet.signMessage(message);

        // const response = { id, result: signedMessage, jsonrpc: "2.0" };

        //await walletKit.respondSessionRequest({ topic, response });
      }
    );

    // TODO: Maybe wrap with rxjs and call off methods when unsubscribed
    const sessions = await this.walletKit.getActiveSessions();
    console.log(sessions);
  */

}

/**
 * Wrapper around WalletKit session that holds additional state about
 * signature requests.
 */
export class PotatoConnectSession {
  constructor(
    public readonly session: SessionTypes.Struct,
    public readonly disconnect: (reason?: DisconnectReason) => void
  ) {}

  get topic(): string {
    return this.session.topic;
  }

  get metadata(): SignClientTypes.Metadata {
    return this.session.peer.metadata
  }
}

/**
 * Keeps track of all sessions and allows to observe changes.
 */
class SessionMap {
  private sessions = new Map<string, PotatoConnectSession>();
  public readonly sessions$ = new BehaviorSubject(this.sessions);

  constructor(private readonly walletKit: IWalletKit) {
    for (const session of Object.values(this.walletKit.getActiveSessions())) {
      this.sessions.set(session.topic, this.wrap(session));
    }
  }

  private wrap(session: SessionTypes.Struct): PotatoConnectSession {
    return new PotatoConnectSession(session, (reason?: DisconnectReason) => {
      this.walletKit.disconnectSession({
        topic: session.topic,
        reason: reason ?? getSdkError("USER_DISCONNECTED"),
      });
      this.sessions.delete(session.topic);
      this.sessions$.next(this.sessions);
    });
  }
}
