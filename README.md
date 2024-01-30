# pieces-copilot-vanilla-typescript-example

A (vanilla) repository of examples for using the PiecesApi in Typescript with the [Pieces Copilot](https://docs.pieces.app/features/pieces-copilot).

Download **Pieces OS** before getting started here. I also recommend getting the **Desktop App** where you can add a few snippets, or interact with the copilot first, and this can help avoid issues with connecting your application.

**IF YOU WANT BOTH PIECES OS AND PIECES DESKTOP: [GO HERE](https://docs.pieces.app/installation-getting-started/what-am-i-installing)**

**IF YOU WANT JUST PIECES OS: [GO HERE](https://docs.pieces.app/installation-getting-started/pieces-os)**

Here are some examples of the api usage in the provided example:

## askQGPT

This endpoint can be used to ask a question to the Pieces Copilot. You don't have to necessarily create a new conversation entirely, and can just send your question directly if you are not having a continuous conversation. Here the userInput is set from what is typed in the textarea (per the example) using the CopilotStreamController:

```typescript
CopilotStreamController.getInstance().askQGPT({
        query: userInput,
        setMessage
    });
```

which in the `CopilotStreamController.ts` file takes the userInput and passes it into:

```typescript
public async askQGPT({
                         query,
                         setMessage
                       }: {
    query: string;
    setMessage: (message: string) => void;
  }): Promise<void> {
    // connect if not established.
    if (!this.ws) {
      this.connect();
    }

    const input: Pieces.QGPTStreamInput = {
      question: {
        query,
        relevant: {iterable: []}
      },
    };

    this.handleMessages({ input, setMessage });
  }
```

## Pieces.QGPTStreamInput

This is the proper type that you send a stream endpoint over on. Query is the input that you would like to send, aka the questions that you would like to ask, and relevance exists here too. It can be used to store a number of related data nearby when having a copilot chat.

```typescript
const input: PiecesQGPTStreamInput = {
	question: {
		query,
		relevant: {iterable: []}
	},
}
```

## Handling Response from `/qgpt/stream`

When you receive a message back, and in this example where it comes back from the websocket here, you will have to parse and type the data ensuring you can get to your props throughout the project.

```typescript
this.ws.onmessage = (msg) => {
      // can start by parsing the msg.data that comes back.
      const json = JSON.parse(msg.data);

      // take that result and pass it into the QGPTStreamOutputFromJSON() endpoint.
      const result = Pieces.QGPTStreamOutputFromJSON(json);

      // then get your answer on the result by getting the first/latest answer.
      const answer: Pieces.QGPTQuestionAnswer | undefined = result.question?.answers.iterable[0];
}
```

## The `connect()` method

When using the WebSocket, we use the raw path here `ws://localhost:1000/qgpt/stream` as the socket on localhost:1000. It's important to ensure that the websocket is running before utilizing it.

So in a simplified connect() it would include:

```typescript
private connect (){

    // set the websocket here.
    this.ws = new WebSocket(`ws://localhost:1000/qgpt/stream`);

    // then onmessage will handle data being sent.
    this.ws.onmessage = (msg) => {
      const json = JSON.parse(msg.data);
      const result = Pieces.QGPTStreamOutputFromJSON(json);
      const answer: Pieces.QGPTQuestionAnswer | undefined = result.question?.answers.iterable[0];

      // this monitors the status of each message to know when a full message has completed.
      // status is 'UKNOWN' until it is completed.
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
      /* 
        ADD YOUR LOGIC HERE TO SET TEXT OR SET.
      */
      // can use this to add text together into one message.
      //   if (answer?.text) {
      //     totalMessage += answer.text;
      //   }
      //   // render the new total message
      //   this.setMessage?.(totalMessage);
      // };
}
```
