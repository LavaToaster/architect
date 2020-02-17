import { Message } from 'discord.js';
import { SessionDocument } from '../../../../models';
import { SessionRepository } from '../../../../repositories';

export interface BaseContext {
  state: string;
}

export interface MachineMessage {
  type: 'message';
  text: string;
}

export interface MachineStep {
  type: 'step';
  step?: string;
}

export type MachineYieldValue = MachineMessage | MachineStep;

export interface MachineConfig<T = any> {
  name: string;
  initial?: string;
  final?: string;
  cleanUp?: boolean;
  states: {
    [key: string]: {
      message: string | ((message: Message, ctx: T & BaseContext) => AsyncGenerator<string, void>);
      handle: (message: Message, ctx: T & BaseContext) => AsyncGenerator<MachineYieldValue, void>;
    };
  };
}

export function nextState(step: string): MachineStep {
  return { type: 'step', step };
}

export function sendMessage(text: string): MachineMessage {
  return { type: 'message', text };
}

export async function processMachine<T = any>(
  config: MachineConfig<T>,
  message: Message,
  session?: SessionDocument<T & BaseContext>,
) {
  const currentStateValue = session?.context?.state ?? config.initial ?? 'start';
  const messages: Message[] = [message];
  let currentState = config.states[currentStateValue];
  const ctx: any = {
    ...(session?.context || {}),
    state: currentStateValue,
  };

  async function sendMessage(text: string) {
    messages.push((await message.channel.send(text, { disableEveryone: true })) as Message);
  }

  async function processMessage() {
    // Nothing to process if the current state doesn't exist
    //  should just be "done" that enters this state...
    if (!currentState) {
      return;
    }

    // Support for simple string messages
    if (typeof currentState.message === 'string') {
      await sendMessage(currentState.message);
      return;
    }

    // Process async functions that yield strings
    for await (const text of currentState.message(message, ctx)) {
      await sendMessage(text);
    }
  }

  const newMessageIds = () => messages.map((m) => m.id);

  if (!session) {
    await processMessage();
    await SessionRepository.create(message.channel.id, message.author.id, config.name, ctx, newMessageIds());

    return;
  }

  for await (const response of currentState?.handle(message, ctx) || []) {
    switch (response.type) {
      case 'message':
        await sendMessage(response.text);
        break;
      case 'step':
        ctx.state = response.step ?? currentStateValue;
        break;
    }
  }

  let processCleanup = true;

  if (currentStateValue !== ctx.state) {
    currentState = config.states[ctx.state];
    await processMessage();

    if (ctx.state === 'done' && config.cleanUp) {
      processCleanup = false;

      await sendMessage('Do you wish to clean up the chat? (`yes` / `no`)');
    }
  }

  // Cleanup Machine Detection!
  let finish = false;

  if (ctx.state === 'done' && processCleanup && config.cleanUp) {
    switch (message.content) {
      case 'no': {
        finish = true;
        await message.react('👍');
        break;
      }
      case 'yes': {
        finish = true;
        await message.channel.bulkDelete([...session.messageIds, ...newMessageIds()]);
        break;
      }
      default: {
        await sendMessage('Either `yes` or `no` 🙂');
      }
    }
  } else if (ctx.state === 'done' && processCleanup) {
    finish = true;
  }

  await SessionRepository.update(message.channel.id, message.author.id, ctx, newMessageIds());

  if (finish) {
    await SessionRepository.finish(message.channel.id, message.author.id);
  }
}
