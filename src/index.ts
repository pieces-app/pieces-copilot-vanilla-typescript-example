import CopilotStreamController from "./CopilotStreamController";

function setMessage(message: string) {
    const outputDiv = document.getElementById('chat-output');
    if (!outputDiv) throw new Error('expected id chat-output');

    outputDiv.innerText = message;
}

// send a messages via askQGPT.
async function sendMessage() {
    const input = document.getElementById('chat-input') as HTMLInputElement | null;
    if (!input) throw new Error('expected id chat-input');

    const userInput = input.value;
    CopilotStreamController.getInstance().askQGPT({
        query: userInput,
        setMessage
    })
}

async function main() {
    CopilotStreamController.getInstance();

    const sendChatBtn = document.getElementById("send-chat-btn");
    if (!sendChatBtn) throw new Error('expected id send-chat-btn');

    const connectBtn = document.getElementById("connect-btn");
    if (!connectBtn) throw new Error('expected id connect-btn');

    const userInput = document.getElementById('chat-input');
    if (!userInput) throw new Error('expected id chat-input');
    
    userInput.onkeydown = (event) => {
        if (event.key === 'Enter') sendMessage();
    }
    sendChatBtn.onclick = sendMessage;
}

window.onload = main;

