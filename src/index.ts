import CopilotStreamController from "./CopilotStreamController";
import ModelProgressController from "./ModelProgressController";
import * as Pieces from "@pieces.app/pieces-os-client";

// sets the message of the chat output.
function setMessage(message: string) {
    const outputDiv = document.getElementById('chat-output');
    if (!outputDiv) throw new Error('expected id chat-output');

    outputDiv.innerText = message;
}

let application: Pieces.Application;
export async function getApplication() {
    if (application) return application;

    // PlatformEnum corresponds to the current operating system that this is being run on.
    //
    // a great example of using a one line conditional to select the proper platform enum.
    const platform: Pieces.PlatformEnum = window.navigator.userAgent.toLowerCase().includes('linux') ? Pieces.PlatformEnum.Linux : window.navigator.userAgent.toLowerCase().includes('win') ? Pieces.PlatformEnum.Windows : Pieces.PlatformEnum.Macos;

    // Creating the Application Here, and setting up the three primary parameters.
    //
    // name: which uses the ApplicationNameEnum. there are some other useful values like .Unknown
    // version: just can pass in a string and does not affect anything but can be used.
    // platform is passed in to the platform parameter
    application = (await new Pieces.ConnectorApi().connect({
        seededConnectorConnection: {
            application: {
                name: Pieces.ApplicationNameEnum.OpenSource,
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
    const modelDownloadsContainer = document.getElementById('model-downloads-container') as HTMLDivElement | null;
    if (!modelDownloadsContainer) throw new Error('expected id model-downloads-container')

    // GPT 3.5/4 Cloud models
    const gpt35 = models.iterable.find((model) => model.foundation === Pieces.ModelFoundationEnum.Gpt35 && !model.name.includes('16k'))!;
    const gpt4 = models.iterable.find((model) => model.foundation === Pieces.ModelFoundationEnum.Gpt4)!;

    // Llama2 Local Models
    const llama27bcpu = models.iterable.find((model) => model.foundation === Pieces.ModelFoundationEnum.Llama27B && model.cpu)!;
    const llama27bgpu = models.iterable.find((model) => model.foundation === Pieces.ModelFoundationEnum.Llama27B && !model.cpu)!;

    // Mistral Local Models
    const mistralCpu = models.iterable.find((model) => model.foundation === Pieces.ModelFoundationEnum.Mistral7B && model.cpu)!;
    const mistralGpu = models.iterable.find((model) => model.foundation === Pieces.ModelFoundationEnum.Mistral7B && !model.cpu)!;

    // Phi-2 Local Models
    const phi2Cpu = models.iterable.find((model) => model.foundation === Pieces.ModelFoundationEnum.Phi2 && model.cpu)!;
    const phi2Gpu = models.iterable.find((model) => model.foundation === Pieces.ModelFoundationEnum.Phi2 && !model.cpu)!;



    // set your model id here for gpt-3.5 so that when the page loads it defaults to 3.5
    CopilotStreamController.selectedModelId = gpt35.id;

    // each button is set equal to the element on the dom, then an onclick is attached to it that will set the
    // selectedModelId to the appropriate model based on user selection.
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


    // llama cpu/GPU buttons are a bit more complex, as these models are conditionally downloaded and need to contain logic
    // around the status, progress, and state of the model in the environment.
    //
    // are essentially the same, so I would use this as a reference if you are looking to create your own button.
    const llama27bcpuButton: HTMLElement | null = document.getElementById('llama2-7b-cpu-radio') as HTMLInputElement | null;
    if (!llama27bcpuButton) throw new Error('expected id llama27bcpuButton');

    // .downloaded will let you know if the model has already been successfully downloaded, and then we use that to
    // either make the radio button clickable.
    if (!llama27bcpu?.downloaded) {
        llama27bcpuButton.setAttribute('disabled', 'true');

        // creates the button for the specific model, adds the correct button message, and then appends the button to
        // our container.
        const downloadLLama27bcpuContainer = document.createElement('div');
        modelDownloadsContainer.appendChild(downloadLLama27bcpuContainer);
        const downloadLlama27bcpuButton = document.createElement('button');
        downloadLlama27bcpuButton.innerText = 'Download Llama2 7B CPU'
        downloadLLama27bcpuContainer.appendChild(downloadLlama27bcpuButton);

        // when the button is clicked, we want to select the specific model that is connected to that button, and
        // log any errors that we may get back when making the request.
        downloadLlama27bcpuButton.onclick = (e) => {
            new Pieces.ModelApi().modelSpecificModelDownload({model: llama27bcpu.id}).then(console.log).catch(console.error)
        }

        // a similar thing takes place here for the download element, we create a div but instead adding text to this container,
        // an ID is given, then we can locate it later via the Websocket and update the appropriate div.
        const llama27bcpuDownloadProgress = document.createElement('div');
        downloadLLama27bcpuContainer.appendChild(llama27bcpuDownloadProgress);
        llama27bcpuDownloadProgress.id = `download-progress-${llama27bcpu.id}`

    // if the model has already been downloaded, then the only option that we want to show on the button
    // and the functionality will change.
    //;etdrive.google.@sop
    // important to notice the ModelsApi()modelsDeleteSpecificModelCache --> then delete the cache using the
    // id on the model itself coming out of Model.foundation.
    } else {
        const deleteLlama27bcpuButton = document.createElement('button');
        modelDownloadsContainer.appendChild(deleteLlama27bcpuButton);
        deleteLlama27bcpuButton.innerText = 'Delete Llama27b CPU';
        deleteLlama27bcpuButton.onclick = () => {
            new Pieces.ModelsApi().modelsDeleteSpecificModelCache({model: llama27bcpu.id, modelDeleteCacheInput: {}}).then(() => {
                // a great tool to refresh the page ->
                window.location.reload()
            })
        }
    }

    const llama27bgpuButton: HTMLElement | null = document.getElementById('llama2-7b-gpu-radio') as HTMLInputElement | null;
    if (!llama27bgpuButton) throw new Error('expected id llama27bgpuButton');

    // llama2 download management
    if (!llama27bgpu?.downloaded) {
        llama27bgpuButton.setAttribute('disabled', 'true');

        const downloadLLama27bgpuContainer = document.createElement('div');
        modelDownloadsContainer.appendChild(downloadLLama27bgpuContainer);

        const downloadLlama27bgpuButton = document.createElement('button');
        downloadLlama27bgpuButton.innerText = 'Download Llama2 7B GPU'
        downloadLLama27bgpuContainer.appendChild(downloadLlama27bgpuButton);

        downloadLlama27bgpuButton.onclick = (e) => {
            new Pieces.ModelApi().modelSpecificModelDownload({model: llama27bgpu.id})
        }

        const llama27bgpuDownloadProgress = document.createElement('div');
        downloadLLama27bgpuContainer.appendChild(llama27bgpuDownloadProgress);
        llama27bgpuDownloadProgress.id = `download-progress-${llama27bgpu.id}`
    } else {
        const deleteLlama27bgpuButton = document.createElement('button');
        modelDownloadsContainer.appendChild(deleteLlama27bgpuButton);
        deleteLlama27bgpuButton.innerText = 'Delete Llama27b GPU';
        deleteLlama27bgpuButton.onclick = () => {
            new Pieces.ModelsApi().modelsDeleteSpecificModelCache({model: llama27bgpu.id, modelDeleteCacheInput: {}}).then(() => {
                window.location.reload()
            })
        }
    }

    // mistral CPU download management.
    const mistralCpuRadio: HTMLElement | null = document.getElementById('mistral-cpu-radio') as HTMLInputElement | null;

    if(!mistralCpu?.downloaded) {
        mistralCpuRadio?.setAttribute('disabled', 'true');

        const downloadMistralCpuContainer = document.createElement('div');
        modelDownloadsContainer.appendChild(downloadMistralCpuContainer);

        const downloadMistralCpuButton = document.createElement('button');
        downloadMistralCpuButton.innerText = "Download Mistral 7B CPU";
        downloadMistralCpuContainer.appendChild(downloadMistralCpuButton);

        downloadMistralCpuButton.onclick = (e) => {
            new Pieces.ModelApi().modelSpecificModelDownload( { model: mistralCpu.id});
        }

        const mistralCpuDownloadProgress = document.createElement('div');
        downloadMistralCpuContainer.appendChild(mistralCpuDownloadProgress);

        // creates the ID we need here using the unique value.
        mistralCpuDownloadProgress.id = `download-progress-${mistralCpu.id}`
    } else  {
        const deleteMistralCpuButton = document.createElement('button');
        modelDownloadsContainer.appendChild(deleteMistralCpuButton);
        deleteMistralCpuButton.innerText = 'Delete Mistral 7b (CPU)';
        deleteMistralCpuButton.onclick = () => {
            new Pieces.ModelsApi().modelsDeleteSpecificModelCache({ model: mistralCpu.id, modelDeleteCacheInput: {}}).then(() => {
                window.location.reload()
            })
        }
    }

    // mistral GPU download management.
    const mistralGpuRadio: HTMLElement | null = document.getElementById('mistral-gpu-radio') as HTMLInputElement | null;

    if(!mistralGpu?.downloaded) {
        mistralGpuRadio?.setAttribute('disabled', 'true');

        const downloadMistralGpuContainer = document.createElement('div');
        modelDownloadsContainer.appendChild(downloadMistralGpuContainer);

        const downloadMistralGpuButton = document.createElement('button');
        downloadMistralGpuButton.innerText = "Download Mistral 7B GPU";
        downloadMistralGpuContainer.appendChild(downloadMistralGpuButton);

        downloadMistralGpuButton.onclick = (e) => {
            new Pieces.ModelApi().modelSpecificModelDownload( { model: mistralGpu.id});
        }

        const mistralGpuDownloadProgress = document.createElement('div');
        downloadMistralGpuContainer.appendChild(mistralGpuDownloadProgress);

        // creates the ID we need here using the unique value.
        mistralGpuDownloadProgress.id = `download-progress-${mistralGpu.id}`
    } else  {
        const deleteMistralGpuButton = document.createElement('button');
        modelDownloadsContainer.appendChild(deleteMistralGpuButton);
        deleteMistralGpuButton.innerText = 'Delete Mistral 7b (GPU)';
        deleteMistralGpuButton.onclick = () => {
            new Pieces.ModelsApi().modelsDeleteSpecificModelCache({ model: mistralGpu.id, modelDeleteCacheInput: {}}).then(() => {
                window.location.reload()
            })
        }
    }

    // Phi2 Cpu
    const phi2CpuRadio: HTMLElement | null = document.getElementById("phi2-cpu-radio") as HTMLInputElement | null;

    if (!phi2Cpu?.downloaded) {
        console.log('not downloaded');
        phi2CpuRadio?.setAttribute('disabled', 'true');

        const downloadPhi2CpuContainer = document.createElement("div");
        modelDownloadsContainer.appendChild(downloadPhi2CpuContainer);

        const downloadPhi2CpuButton = document.createElement("button");
        downloadPhi2CpuButton.innerText = "Download Phi-2 CPU"
        downloadPhi2CpuContainer.appendChild(downloadPhi2CpuButton);

        downloadPhi2CpuButton.onclick = () => {
            new Pieces.ModelApi().modelSpecificModelDownload( { model: phi2Cpu.id});
        }

        const phi2CpuDownloadProgress = document.createElement("div");
        downloadPhi2CpuContainer.appendChild(phi2CpuDownloadProgress);

        phi2CpuDownloadProgress.id = `download-progress-${phi2Cpu.id}`
    } else {
        const deletePhi2CpuButton = document.createElement("button");
        modelDownloadsContainer.appendChild(deletePhi2CpuButton);
        deletePhi2CpuButton.innerText = 'Delete Phi2 CPU';
        deletePhi2CpuButton.onclick = () => {
            new Pieces.ModelsApi().modelsDeleteSpecificModelCache({model: mistralGpu.id, modelDeleteCacheInput: {}}).then(() => {
                window.location.reload()
            })
        }
    }

    // Phi2 GPU
    const phi2GpuRadio: HTMLElement | null = document.getElementById("phi2-gpu-radio") as HTMLInputElement | null;

    if (!phi2Gpu?.downloaded) {
        phi2GpuRadio?.setAttribute("disabled", "true");

        const downloadPhi2GpuContainer = document.createElement("div");
        modelDownloadsContainer.appendChild(downloadPhi2GpuContainer);

        const downloadPhi2GpuButton = document.createElement("button");
        downloadPhi2GpuButton.innerText = "Download Phi-2 GPU";
        downloadPhi2GpuContainer.appendChild(downloadPhi2GpuButton);

        downloadPhi2GpuButton.onclick = () => {
            new Pieces.ModelApi().modelSpecificModelDownload({model: phi2Gpu.id});
        }

        const phi2GpuDownloadProgress = document.createElement("div");
        downloadPhi2GpuContainer.appendChild(phi2GpuDownloadProgress);

        phi2GpuDownloadProgress.id = `download-progress-${phi2Gpu.id}`;
    } else {
        const deletePhi2GpuButton = document.createElement("button");
        modelDownloadsContainer.appendChild(deletePhi2GpuButton);
        deletePhi2GpuButton.innerText = 'Delete Phi2 GPU';
        deletePhi2GpuButton.onclick = () => {
            new Pieces.ModelsApi().modelsDeleteSpecificModelCache({ model: mistralGpu.id, modelDeleteCacheInput: {}}).then(() => {
                window.location.reload();
            })
        }
    }

    // button controls when the userInput.value is sent over to the copilot as a query.
    const sendChatBtn = document.getElementById("send-chat-btn");
    if (!sendChatBtn) throw new Error('expected id send-chat-btn');

    // <textarea> where the message is typed.
    const userInput = document.getElementById('chat-input');
    if (!userInput) throw new Error('expected id chat-input');


    const addFilesAsContext = document.getElementById("add-files-as-context");
    if (!addFilesAsContext) throw new Error('expected id add-files-as-context');

    addFilesAsContext.onclick = () => {
        new Pieces.OSApi().pickFiles({filePickerInput: {}}).then((files) => {
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



