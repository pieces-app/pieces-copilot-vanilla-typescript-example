import * as Pieces from "@pieces.app/pieces-os-client";
import {Model, ModelApi, ModelDownloadProgressStatusEnum} from "@pieces.app/pieces-os-client";


export default class ModelProgressController {
  private static instance: ModelProgressController;

  public modelDownloadStatus = new Map<
    string,
    Pieces.ModelDownloadProgressStatusEnum
  >(); // status of all relevant model downloads

  public models: Promise<Pieces.Models>; // models snapshot

  private sockets: { [key: string]: WebSocket } = {}; // model id -> its download socket

  /**
   * Initializes the sockets
   */
  private constructor() {
    this.models = new Pieces.ModelsApi().modelsSnapshot();

    this.models.then((models) => {
      this.initSockets(
        models.iterable.filter(
          (el) =>
            // this filter is important and defines what possible websockets will be initialized and included in the filtered list.
            (el.foundation === Pieces.ModelFoundationEnum.Llama27B || el.foundation === Pieces.ModelFoundationEnum.Mistral7B || el.foundation === Pieces.ModelFoundationEnum.Phi2) && el.unique !== 'llama-2-7b-chat.ggmlv3.q4_K_M'
        )
      );
    });
  }

  /**
   * This opens all sockets via the constructor
   * @param models all models to initialize the sockets
   */
  private initSockets(models: Model[]) {
    for (const model of models) {
      this.connect(model);
    }
  }

  /**
   * This opens a socket, and handles all messaging / error handling needs for that model's socket
   * @param model The model to connect a socket
   */
  private connect(model: Model) {
    const ws: WebSocket = new WebSocket(
      `ws://localhost:${1000}/model/${model.id}/download/progress`
    );

    // model.id is used to reference the correct sockets.
    this.sockets[model.id] = ws;

    // on a message being sent, we get back data from Pieces for each data event. As each pieces of data is sent over
    // we get back percentage numbers or a status depending on what point of the process we are in.
    ws.onmessage = (evt) => {
      const event = Pieces.ModelDownloadProgressFromJSON(JSON.parse(evt.data));
      const downloadProgressElement = document.getElementById(`download-progress-${model.id}`)
      console.log(`${model.name}`)
      if (!downloadProgressElement) return;

      // controls what text shows as the model is in different states - you can see this
      // update and change as the download starts, and is successfully downloading.
      downloadProgressElement.innerText = `${model.name} download progress: ${event.percentage ?? event.status}` + (event.percentage ? '%' : '');

      // when you first press the button to download a model, it enters an initialized status to ensure connection
      // before the percentages start coming over and take the place of the initialized value.
      //
      // this case is only at the beginning of a download.
      if (event.status === ModelDownloadProgressStatusEnum.Initialized) {

        // we immediately add the download cancel button to stop the download at any point as it is downloading.
        // model.id and model.name are used, so we can create unique items for the new cancelDownload button, that way
        // we stop the appropriate cancel download button text, and specifically delete the model based on its model.id.
        const cancelDownloadButton = document.createElement('button');
        cancelDownloadButton.id = `cancel-download-button-${model.id}`
        downloadProgressElement.insertAdjacentElement('afterend', cancelDownloadButton);
        cancelDownloadButton.innerText = `Cancel ${model.name} download`;

        // onclick the ModelApi.modelSpecificDownloadCancel can but used and will only delete the one model specified here.
        // you do not need a .then, but you can add error handling here as needed.
        cancelDownloadButton.onclick = () => {
          new ModelApi().modelSpecificModelDownloadCancel({model: model.id});
        }
        // if the model is failed or unknown in event.status, that means something has gone wrong and we want to
        // remove the cancel button so the models are not messed up.
      } else if (event.status === ModelDownloadProgressStatusEnum.Failed || event.status === ModelDownloadProgressStatusEnum.Unknown || event.status === ModelDownloadProgressStatusEnum.Completed) {
        document.getElementById(`cancel-download-button-${model.id}`)?.remove();
      }

      // when the models complete downloading, we refresh the page can detect what models are now downloaded.
      if (event.status === ModelDownloadProgressStatusEnum.Completed) window.location.reload();
    }
  }

  public static getInstance() {
    return (this.instance ??= new ModelProgressController());
  }
}
