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
            el.foundation === Pieces.ModelFoundationEnum.Llama27B &&
            el.unique !== 'llama-2-7b-chat.ggmlv3.q4_K_M'
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
    this.sockets[model.id] = ws;
    ws.onmessage = (evt) => {
      const event = Pieces.ModelDownloadProgressFromJSON(JSON.parse(evt.data));
      const downloadProgressElement = document.getElementById(`download-progress-${model.id}`)
      if (!downloadProgressElement) return;
      downloadProgressElement.innerText = `${model.name} download progress: ${event.percentage ?? event.status}` + (event.percentage ? '%' : '');

      if (event.status === ModelDownloadProgressStatusEnum.Initialized) {
        const cancelDownloadButton = document.createElement('button');
        cancelDownloadButton.id = `cancel-download-button-${model.id}`
        downloadProgressElement.insertAdjacentElement('afterend', cancelDownloadButton);
        cancelDownloadButton.innerText = `Cancel ${model.name} download`;
        cancelDownloadButton.onclick = () => {
          new ModelApi().modelSpecificModelDownloadCancel({model: model.id});
        }
      } else if (event.status === ModelDownloadProgressStatusEnum.Failed || event.status === ModelDownloadProgressStatusEnum.Unknown || event.status === ModelDownloadProgressStatusEnum.Completed) {
        document.getElementById(`cancel-download-button-${model.id}`)?.remove();
      }

      if (event.status === ModelDownloadProgressStatusEnum.Completed) window.location.reload();
    }
  }

  public static getInstance() {
    return (this.instance ??= new ModelProgressController());
  }
}
