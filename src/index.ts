import CopilotStreamController from "./CopilotStreamController";
import ModelProgressController from "./ModelProgressController";
import {ModelFoundationEnum, ModelsApi, ModelApi} from "@pieces.app/pieces-os-client";
// sets the message of the chat output.
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

// gets our copilot stream instance.
async function main() {
    CopilotStreamController.getInstance();
    const modelProgressController = ModelProgressController.getInstance();

    const models = await modelProgressController.models;

    const modelDownloadsContainer = document.getElementById('model-downloads-container') as HTMLDivElement | null;
    if (!modelDownloadsContainer) throw new Error('expected id model-downloads-container')

    const gpt35 = models.iterable.find((model) => model.foundation === ModelFoundationEnum.Gpt35 && !model.name.includes('16k'))!;
    CopilotStreamController.selectedModelId = gpt35.id;
    const gpt4 = models.iterable.find((model) => model.foundation === ModelFoundationEnum.Gpt4)!;
    const llama27bcpu = models.iterable.find((model) => model.foundation === ModelFoundationEnum.Llama27B && model.cpu)!;
    const llama27bgpu = models.iterable.find((model) => model.foundation === ModelFoundationEnum.Llama27B && !model.cpu)!;

    const gpt35Button: HTMLElement | null = document.getElementById('gpt-35-radio') as HTMLInputElement | null;
    if (!gpt35Button) throw new Error('expected id gpt35Button');
    gpt35Button.onclick = () => {
        CopilotStreamController.selectedModelId = gpt35.id;
    }

    const gpt4Button: HTMLElement | null = document.getElementById('gpt-4-radio') as HTMLInputElement | null;
    if (!gpt4Button) throw new Error('expected id gpt4Button');
    gpt4Button.onclick = () => {
        CopilotStreamController.selectedModelId = gpt4.id;
    }


    // llama cpu
    const llama27bcpuButton: HTMLElement | null = document.getElementById('llama2-7b-cpu-radio') as HTMLInputElement | null;
    if (!llama27bcpuButton) throw new Error('expected id llama27bcpuButton');
    if (!llama27bcpu?.downloaded) {
        llama27bcpuButton.setAttribute('disabled', 'true');

        const downloadLLama27bcpuContainer = document.createElement('div');
        modelDownloadsContainer.appendChild(downloadLLama27bcpuContainer);

        const downloadLlama27bcpuButton = document.createElement('button');
        downloadLlama27bcpuButton.innerText = 'Download Llama2 7B CPU'
        downloadLLama27bcpuContainer.appendChild(downloadLlama27bcpuButton);

        downloadLlama27bcpuButton.onclick = (e) => {
            new ModelApi().modelSpecificModelDownload({model: llama27bcpu.id}).then(console.log).catch(console.error)
        }

        const llama27bcpuDownloadProgress = document.createElement('div');
        downloadLLama27bcpuContainer.appendChild(llama27bcpuDownloadProgress);
        llama27bcpuDownloadProgress.id = `download-progress-${llama27bcpu.id}`
    } else {
        const deleteLlama27bcpuButton = document.createElement('button');
        modelDownloadsContainer.appendChild(deleteLlama27bcpuButton);
        deleteLlama27bcpuButton.innerText = 'Delete Llama27b CPU';
        deleteLlama27bcpuButton.onclick = () => {
            new ModelsApi().modelsDeleteSpecificModelCache({model: llama27bcpu.id, modelDeleteCacheInput: {}}).then(() => {
                window.location.reload()
            })
        }
    }

    const llama27bgpuButton: HTMLElement | null = document.getElementById('llama2-7b-gpu-radio') as HTMLInputElement | null;
    if (!llama27bgpuButton) throw new Error('expected id llama27bgpuButton');

    // llama gpu
    if (!llama27bgpu?.downloaded) {
        llama27bgpuButton.setAttribute('disabled', 'true');

        const downloadLLama27bgpuContainer = document.createElement('div');
        modelDownloadsContainer.appendChild(downloadLLama27bgpuContainer);

        const downloadLlama27bgpuButton = document.createElement('button');
        downloadLlama27bgpuButton.innerText = 'Download Llama2 7B GPU'
        downloadLLama27bgpuContainer.appendChild(downloadLlama27bgpuButton);

        downloadLlama27bgpuButton.onclick = (e) => {
            new ModelApi().modelSpecificModelDownload({model: llama27bgpu.id})
        }

        const llama27bgpuDownloadProgress = document.createElement('div');
        downloadLLama27bgpuContainer.appendChild(llama27bgpuDownloadProgress);
        llama27bgpuDownloadProgress.id = `download-progress-${llama27bgpu.id}`
    } else {
        const deleteLlama27bgpuButton = document.createElement('button');
        modelDownloadsContainer.appendChild(deleteLlama27bgpuButton);
        deleteLlama27bgpuButton.innerText = 'Delete Llama27b GPU';
        deleteLlama27bgpuButton.onclick = () => {
            new ModelsApi().modelsDeleteSpecificModelCache({model: llama27bgpu.id, modelDeleteCacheInput: {}}).then(() => {
                window.location.reload()
            })
        }
    }

    const sendChatBtn = document.getElementById("send-chat-btn");
    if (!sendChatBtn) throw new Error('expected id send-chat-btn');

    const userInput = document.getElementById('chat-input');
    if (!userInput) throw new Error('expected id chat-input');

    // check to see what is downloaded here
    
    userInput.onkeydown = (event) => {
        if (event.key === 'Enter') sendMessage();
    }
    sendChatBtn.onclick = sendMessage;
}

window.onload = main;

