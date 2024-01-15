import { RequestConfigByHttpClient, HttpClient } from "@base";

/**
 * TranslatorClient extends the HttpClient class to provide a client for interacting with
 * the OpenAI chat completions API to generate translated text.
 */
export class TranslatorClient extends HttpClient<typeof TranslatorClient> {
  declare static payload: Partial<TranslatorClient.Payload>;
  declare static response: ToObject<TranslatorClient.Response>;

  static defaults: RequestConfigByHttpClient<typeof TranslatorClient> = {
    url: "https://api.openai.com",
    endpoint: "/v1/chat/completions",
    headers: {
      "accept": "application/json",
      "authorization": `Bearer ${Deno.env.get("OPENAI_SECRET_KEY")}`,
      "content-type": "application/json",
    },
    body: {
      temperature: 1,
      n: 1,
      messages: [],
    },
  };

  /**
   * Initializes a new instance of the `TranslatorClient`.
   *
   * @param systemInstructions - Array of instruction strings for the translator model.
   * @remarks The first sentence of the instructions will always be *"I want you to
   *          act as a translator"*. Try to continue the sentence naturally with your
   *          custom instructions.
   */
  public constructor(systemInstructions: string[]) {
    super({
      body: {
        messages: [
          {
            role: "system",
            content: ["I want you to act as a translator.", ...systemInstructions].join(
              " ",
            ),
          },
        ],
      },
    });
  }

  async translate(text: string) {
    const response = await this.post({
      body: { messages: [{ role: "user", content: text }] },
    });

    return response.choices[0].message.content.trim();
  }
}

export namespace TranslatorClient {
  export interface Payload {
    /**
     * ID of the model to use.
     *
     * @see {@link https://platform.openai.com/docs/models/model-endpoint-compatibility Model endpoint compatibility}
     */
    model: Model;
    /**
     * A list of messages comprising the conversation so far.
     */
    messages: Message[];
    /**
     * Sampling temperature to use, between `0` and `2`. Higher values like `0.8` will
     * make the output more random, while lower values like `0.2` will make it more
     * focused and deterministic.
     */
    temperature?: number;
    /**
     * How many chat completion choices to generate for each input message. Note that you
     * will be charged based on the number of generated tokens across all of the choices.
     */
    n?: number;
    /**
     * Number between -2.0 and 2.0. Positive values penalize new tokens based on their
     * existing frequency in the text so far, decreasing the model's likelihood to repeat
     * the same line verbatim.
     *
     * @see {@link https://platform.openai.com/docs/guides/text-generation/parameter-details}
     */
    frequency_penalty?: number;
    /**
     * Number between -2.0 and 2.0. Positive values penalize new tokens based on whether
     * they appear in the text so far, increasing the model's likelihood to talk about new
     * topics.
     *
     * @see {@link https://platform.openai.com/docs/guides/text-generation/parameter-details More}
     */
    presence_penalty?: number;
  }

  export interface Response {
    id: string;
    object: "chat.completion";
    created: number;
    model: Model;
    system_fingerprint: string;
    choices: Choice[];
    usage: Usage;
  }

  export type Choice = {
    index: number;
    finish_reason: string;
    message: Message;
  };

  export type Message = SystemMessage | UserMessage;

  export type SystemMessage = GenericMessage<"system">;

  export type Usage = {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };

  export type UserMessage = GenericMessage<"user">;

  // #region  Private
  type GenericMessage<T extends string> = {
    /**
     * The contents of the message.
     */
    content: string;
    /**
     * The role of the message author.
     */
    role: T;
    /**
     * An optional name for the participant. Provides the model information to
     * differentiate between participants of the same role.
     */
    name?: string;
  };

  type Model =
    | "gpt-4"
    | "gpt-4-1106-preview"
    | "gpt-4-vision-preview"
    | "gpt-4-32k"
    | "gpt-3.5-turbo"
    | "gpt-3.5-turbo-16k"
    | "gpt-3.5-turbo";

  // #endregion  Private
}
