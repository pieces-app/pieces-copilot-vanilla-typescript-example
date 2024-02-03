import CopilotStreamController from "./CopilotStreamController";
import ModelProgressController from "./ModelProgressController";
import {
    Application,
    ApplicationNameEnum,
    ConnectorApi, Model,
    ModelApi,
    ModelFoundationEnum,
    ModelsApi,
    OSApi,
    PlatformEnum
} from "@pieces.app/pieces-os-client";

// sets the message of the chat output.
function setMessage(message: string) {
    const outputDiv = document.getElementById('chat-output');
    if (!outputDiv) throw new Error('expected id chat-output');

    outputDiv.innerText = message;
}

let application: Application;
export async function getApplication() {
    if (application) return application;

    // PlatformEnum corresponds to the current operating system that this is being run on.
    //
    // a great example of using a one line conditional to select the proper platform enum.
    const platform: PlatformEnum = window.navigator.userAgent.toLowerCase().includes('linux') ? PlatformEnum.Linux : window.navigator.userAgent.toLowerCase().includes('win') ? PlatformEnum.Windows : PlatformEnum.Macos;

    // Creating the Application Here, and setting up the three primary parameters.
    //
    // name: which uses the ApplicationNameEnum. there are some other useful values like .Unknown
    // version: just can pass in a string and does not affect anything but can be used.
    // platform is passed in to the platform parameter
    application = (await new ConnectorApi().connect({
        seededConnectorConnection: {
            application: {
                name: ApplicationNameEnum.OpenSource,
                version: '0.0.0',
                platform
            }
        }

        // for some reason you have to follow this structure here to get your application back and return it.
        // once you complete these steps you should no longer have to create you application and register your connection.
    })).application
    return application;
}

// send a messages via askQGPT.
//
// Note the usage of the CopilotStreamController.getInstance().askQGPT to send over the message.
async function sendMessage() {
    const input = document.getElementById('chat-input') as HTMLInputElement | null;
    if (!input) throw new Error('expected id chat-input');

    // reads from the input of the html element that we got with the document.getElementById(), then pass
    // that value over and also set the message via the setMessage function.
    const userInput = input.value;
    CopilotStreamController.getInstance().askQGPT({
        query: userInput,
        setMessage
    })
}

// the main entry point of the application, where the initial CopilotStreamController.getInstance and
// ModelProgressController.getInstance take place. Below all of this main() function you will find a window.onload,
// where you pull this main function in.
async function main() {
    CopilotStreamController.getInstance();
    const modelProgressController = ModelProgressController.getInstance();

    // gets all models that are potentially available
    const models = await modelProgressController.models;

    // creates the bos around the models download buttons that hold each of the button options.
    const modelDownloadsContainer = document.getElementById('model-downloads-container') as HTMLDivElement;
    if (!modelDownloadsContainer) throw new Error('expected id model-downloads-container')

    // set all model values for setting each onclick function.
    const gpt35 = models.iterable.find((model) => model.foundation === ModelFoundationEnum.Gpt35 && !model.name.includes('16k'))!;
    const gpt4 = models.iterable.find((model) => model.foundation === ModelFoundationEnum.Gpt4)!;
    const llama27bcpu = models.iterable.find((model) => model.foundation === ModelFoundationEnum.Llama27B && model.cpu)!;
    const llama27bgpu = models.iterable.find((model) => model.foundation === ModelFoundationEnum.Llama27B && !model.cpu)!;
    const mistralcpu = models.iterable.find((model) =>  model.foundation === ModelFoundationEnum.Mistral7B && model.cpu)!;
    const mistralgpu = models.iterable.find((model) =>  model.foundation === ModelFoundationEnum.Mistral7B && !model.cpu)!;

    // set your model id here for gpt-3.5 so that when the page loads it defaults to 3.5
    CopilotStreamController.selectedModelId = gpt35.id;


    // each button is set equal to the element on the dom, then an onclick is attached to it that will set the
    // selectedModelId to the appropriate model based on user selection.
    const gpt35Radio: HTMLElement | null = document.getElementById('gpt-35-radio') as HTMLInputElement | null;
    if (!gpt35Radio) throw new Error('expected id gpt35RadioButton');
    gpt35Radio.onclick = () => {
        CopilotStreamController.selectedModelId = gpt35.id;
    }

    const gpt4Radio: HTMLElement | null = document.getElementById('gpt-4-radio') as HTMLInputElement | null;
    if (!gpt4Radio) throw new Error('expected id gpt4RadioButton');
    gpt4Radio.onclick = () => {
        CopilotStreamController.selectedModelId = gpt4.id;
    }

    // function for managing the downloaded model state.
    // TODO: add details here around parameters and this new function.
    function downloadButtonState(model: Model, radio: HTMLInputElement, downloadContainer: HTMLDivElement, downloadButton: HTMLButtonElement, downloadProgress: HTMLDivElement, deleteButton: HTMLButtonElement) {
        if (!model.downloaded) {
            radio.setAttribute('disabled', 'true');

            modelDownloadsContainer!.appendChild(downloadContainer);
            // TODO: need to add some systems for managing the strings for each button based on its model.
            downloadButton.innerText = `Download ${model.name}`;
            downloadContainer.appendChild(downloadButton);

            // download logic for the model downloads when a user clicks the download button.
            downloadButton.onclick = () => {
                new ModelApi().modelSpecificModelDownload({model: model.id}).then(console.log).catch(console.error)
            }

            downloadContainer.appendChild(downloadProgress);
            downloadProgress.id = `download-progress-${model.id}`
        } else {


            modelDownloadsContainer!.appendChild(deleteButton);


            deleteButton.innerText = `Delete ${model.name}`;
            deleteButton.onclick = () => {
                new ModelsApi().modelsDeleteSpecificModelCache({model: model.id, modelDeleteCacheInput: {}}).then(() => {
                    // a great tool to refresh the page ->
                    window.location.reload()
                })
            }

        }
    }

    const llama27bcpuRadio: HTMLInputElement | null = document.getElementById('llama2-7b-cpu-radio') as HTMLInputElement | null;
    if (!llama27bcpuRadio) throw new Error('expected id llama27bcpuButton');

    // Llama2 CPU centric buttons, const, and elements. These are used in the downloadButtonState for handing download progress.
    const downloadLLama27bcpuContainer = document.createElement('div');
    const llama27bcpuDownloadProgress = document.createElement('div');
    const downloadLlama27bcpuButton = document.createElement('button');
    const deleteLlama27bcpuButton = document.createElement('button');

    downloadButtonState(llama27bcpu, llama27bcpuRadio, downloadLLama27bcpuContainer, downloadLlama27bcpuButton, llama27bcpuDownloadProgress, deleteLlama27bcpuButton);

    // get the LLAMA2 radio button for selection.
    const llama27bgpuRadio: HTMLInputElement | null = document.getElementById('llama2-7b-gpu-radio') as HTMLInputElement | null;
    if (!llama27bgpuRadio) throw new Error('expected id llama27bgpuRadio');

    // Llama2 GPU centric
    const downloadLLama27bgpuContainer = document.createElement('div');
    const downloadLlama27bgpuButton = document.createElement('button');
    const llama27bgpuDownloadProgress = document.createElement('div');
    const deleteLlama27bgpuButton = document.createElement('button');

    downloadButtonState(llama27bgpu, llama27bgpuRadio, downloadLLama27bgpuContainer,downloadLlama27bgpuButton, llama27bgpuDownloadProgress, deleteLlama27bgpuButton);

    const mistralCpuRadio: HTMLInputElement | null = document.getElementById('mistral-cpu-radio') as HTMLInputElement | null;
    if (!mistralCpuRadio) throw new Error('expected id mistral-cpu-radio');

    // mistral CPU centric
    const mistralCpuContainer = document.createElement('div');
    const downloadMistralCpuButton = document.createElement('button');
    const mistralCpuDownloadProgress = document.createElement('div');
    const deleteMistralCpuButton = document.createElement('button');

    downloadButtonState(mistralcpu, mistralCpuRadio, mistralCpuContainer, downloadMistralCpuButton, mistralCpuDownloadProgress, deleteMistralCpuButton);

    const mistralGpuRadio: HTMLInputElement | null = document.getElementById('mistral-gpu-radio') as HTMLInputElement | null;
    if (!mistralGpuRadio) throw new Error('expected id mistral-cpu-button');

    // mistral GPU centric
    const mistralGpuContainer = document.createElement('div');
    const downloadMistralGpuButton = document.createElement('button');
    const mistralGpuDownloadProgress = document.createElement('div');
    const deleteMistralGpuButton = document.createElement('button');

    downloadButtonState(mistralgpu, mistralGpuRadio, mistralGpuContainer, downloadMistralGpuButton, mistralGpuDownloadProgress, deleteMistralGpuButton);

    // button controls when the userInput.value is sent over to the copilot as a query.
    const sendChatBtn = document.getElementById("send-chat-btn");
    if (!sendChatBtn) throw new Error('expected id send-chat-btn');

    // <textarea> where the message is typed.
    const userInput = document.getElementById('chat-input');
    if (!userInput) throw new Error('expected id chat-input');


    const addFilesAsContext = document.getElementById("add-files-as-context");
    if (!addFilesAsContext) throw new Error('expected id add-files-as-context');

    addFilesAsContext.onclick = () => {
        new OSApi().pickFiles({filePickerInput: {}}).then((files) => {
            files.forEach((file) => {

                // holds text of each file that is added.
                const contextContainer = document.getElementById('context-files-added-container');
                if (!contextContainer) throw new Error ('expected id context-files-added-container');

                const newFileEntry = document.createElement( "p");
                newFileEntry.innerText = file;
                contextContainer.appendChild(newFileEntry);

                CopilotStreamController.selectedContextFiles.push(file)
            })
        })
    }

    // handling for when a user presses enter to send the message just the same a selecting the button.
    userInput.onkeydown = (event) => {
        if (event.key === 'Enter') sendMessage();
    }
    sendChatBtn.onclick = sendMessage;
}

window.onload = main;



