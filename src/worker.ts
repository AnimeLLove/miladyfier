import * as ort from "onnxruntime-web";

import type { WorkerRequest, WorkerResponse } from "./shared/types";

interface InitMessage {
  modelUrl: string;
  wasmPath: string;
  positiveIndex?: number;
}

let sessionPromise: Promise<ort.InferenceSession> | null = null;
let positiveIndex = 1;

self.addEventListener("message", async (event: MessageEvent<InitMessage | WorkerRequest>) => {
  const data = event.data;

  if ("modelUrl" in data) {
    ort.env.wasm.wasmPaths = data.wasmPath;
    positiveIndex = typeof data.positiveIndex === "number" ? data.positiveIndex : 1;
    sessionPromise = ort.InferenceSession.create(data.modelUrl, {
      executionProviders: ["wasm"],
      graphOptimizationLevel: "all",
    });
    return;
  }

  if (!sessionPromise) {
    throw new Error("Worker used before model initialization");
  }

  const session = await sessionPromise;
  const tensorData = data.tensor ?? data.features;
  const shape = data.shape ?? (data.features ? [1, data.features.length] : null);
  if (!tensorData || !shape) {
    throw new Error("Worker received no tensor payload");
  }
  const tensor = new ort.Tensor("float32", Float32Array.from(tensorData), shape);
  const outputName = session.outputNames[0];
  const result = await session.run({
    input: tensor,
  });
  const output = Array.from(result[outputName].data as Iterable<number>);
  const score = output.length === 1 ? Number(output[0]) : Number(output[positiveIndex] ?? output[0]);

  const response: WorkerResponse = {
    id: data.id,
    score,
  };

  self.postMessage(response);
});
