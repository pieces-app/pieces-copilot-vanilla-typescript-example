# pieces-copilot-vanilla-typescript-example

A simple (vanilla) repository of examples for using the PiecesApi in Typescript.

Download [Pieces OS](https://docs.pieces.app/installation-getting-started/what-am-i-installing) before getting started here.

Here are some examples of the api usage in the provided example:

## askQGPT

This endpoint can be used to ask a question to the pieces copilot. You dont have to neccisarily create a new conversation entirely, and can just send your question directly if you are not having a continuious conversation. Here the userInput is set from what is typed in the textarea (per the example) using the CopilotStreamController:

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
