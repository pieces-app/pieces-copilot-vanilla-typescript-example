import * as Pieces from "@pieces.app/pieces-os-client";

/**
 * Stream controller class for interacting with the QGPT websocket
 */
export default class CopilotStreamController {
  private static instance: CopilotStreamController;

  private ws: WebSocket | null = null; // the qgpt websocket

  private setMessage: undefined | ((message: string) => void); // the current answer element to be updated from socket events

  // this is resolved when the socket is ready.
  private connectionPromise: Promise<void> = new Promise<void>((res) => res);

  //@TODO implement socket unloading
  private constructor() {
    this.connect();
  }

  /**
   * cleanup function
   */
  public closeSocket() {
    this.ws?.close();
  }

  /**
   * This is the entry point for all chat messages into this socket.
   * @param param0 The inputted user query, and the function to update the message
   */
  public async askQGPT({
                         query,
                         setMessage
                       }: {
    query: string;
    setMessage: (message: string) => void;
  }): Promise<void> {
    // need to connect the socket if it's not established.
    if (!this.ws) {
      this.connect();
    }
    
    // @TODO add conversation id
    const input: Pieces.QGPTStreamInput = {
      question: {
        query,
        relevant: {iterable: []} //@TODO hook up /relevance here for context
      },
    };

    this.handleMessages({ input, setMessage });
  }

  /**
   * Connects the websocket, handles all message callbacks, error handling, and rendering.
   */
  private connect() {
    this.ws = new WebSocket(`ws://localhost:1000/qgpt/stream`);

    let totalMessage = '';

    this.ws.onmessage = (msg) => {
      const json = JSON.parse(msg.data);
      const result = Pieces.QGPTStreamOutputFromJSON(json); // strongly type the incoming message
      const answer: Pieces.QGPTQuestionAnswer | undefined = result.question?.answers.iterable[0];


      // the message is complete, or we do nothing
      if (result.status === 'COMPLETED') {
        // in the unlikely event there is no message, show an error message
        if (!totalMessage) {
          this.setMessage?.("ERROR: received no messages from the copilot websockets")
        }
        // render the new total message
        this.setMessage?.(
          totalMessage,
        );
        // cleanup
        totalMessage = '';
        return;
      } else if (result.status === 'FAILED' || result.status === 'UNKNOWN') {
        this.setMessage?.('Message failed')
        totalMessage = '';
        return;
      }
      
      // add to the total message
      if (answer?.text) {
        totalMessage += answer.text;
      }
      // render the new total message
      this.setMessage?.(totalMessage);
    };

    // in the case that websocket is closed or errored we do some cleanup here
    const refreshSockets = (error?: any) => {
      if (error) console.error(error);
      totalMessage = '';
      this.setMessage?.('Websocket closed')
      this.ws = null;
    };

    // on error or close, cleanup the total message
    this.ws.onerror = refreshSockets;
    this.ws.onclose = refreshSockets;

    // await this to ensure that the websocket connection has been fully established
    this.connectionPromise = new Promise((res) => {
      if (!this.ws)
        throw new Error(
          'There is no websocket in Copilot Stream Controller (race condition)'
        );
      this.ws.onopen = () => res();
    });
  }

  /**
   *
   * @param param0 the input into the websocket, and the function to update the ui.
   */
  private async handleMessages({
                                 input,
                                 setMessage,
                               }: {
    input: Pieces.QGPTStreamInput;
    setMessage: (message: string) => void;
  }) {
    if (!this.ws) this.connect();
    await this.connectionPromise;
    this.setMessage = setMessage;

    try {
      this.ws!.send(JSON.stringify(input));
    } catch (err) {
      console.error('err', err);
      setMessage?.(JSON.stringify(err, undefined, 2));
    }
  }

  public static getInstance() {
    return (CopilotStreamController.instance ??= new CopilotStreamController());
  }
}