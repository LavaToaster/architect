import { processMachine, MachineConfig, sendMessage, nextState } from './machine';
import { Message } from 'discord.js';
import { SessionRepository } from '../../../../repositories';

const example1: MachineConfig = {
  name: 'test-machine',
  states: {
    start: {
      message: 'Begin!',
      handle: async function*(message, ctx) {
        yield sendMessage("It's a response!");
        yield nextState('next');
      },
    },
    next: {
      message: async function*(message, ctx) {
        yield 'Almost there :)';
      },
      handle: async function*(message, ctx) {
        yield sendMessage("It's a another response!");
        yield nextState('done');
      },
    },
  },
};

jest.mock('../../../../repositories');
const mockedCreate: jest.Mock<typeof SessionRepository['create']> = SessionRepository.create as any;
const mockedUpdate: jest.Mock<typeof SessionRepository['update']> = SessionRepository.update as any;
const mockedFinish: jest.Mock<typeof SessionRepository['finish']> = SessionRepository.finish as any;

describe('machine', () => {
  it('none -> start', async () => {
    const send: any = jest.fn().mockImplementationOnce(() => ({ id: 'reply1' }));

    mockedCreate.mockImplementationOnce(async function(
      channelId: string,
      userId: string,
      cmd: string,
      context: object,
      messageIds: string[],
    ) {
      expect(channelId).toBe('text');
      expect(userId).toBe('test');
      expect(cmd).toBe('test-machine');
      expect(context).toEqual({
        state: 'start',
      });
      expect(messageIds).toEqual(['test-message1', 'reply1']);
    } as any);

    const message = {
      id: 'test-message1',
      author: {
        id: 'test',
      },
      channel: {
        id: 'text',
        send,
      },
    };

    await processMachine(example1, message as any);

    expect(send).toHaveBeenCalledWith('Begin!', { disableEveryone: true });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('start -> next', async () => {
    const send: any = jest.fn().mockImplementationOnce(() => ({ id: 'reply1' })).mockImplementationOnce(() => ({ id: 'reply2' }));

    mockedUpdate.mockImplementationOnce(async function(
      channelId: string,
      userId: string,
      context: object,
      messageIds: string[]
    ) {
      expect(channelId).toBe('text');
      expect(userId).toBe('test');
      expect(context).toEqual({
        state: 'next',
      });
      expect(messageIds).toEqual(['test-message2', 'reply1', 'reply2']);
    } as any);

    await processMachine(example1, ({
      id: 'test-message2',
      author: {
        id: 'test',
      },
      channel: {
        id: 'text',
        send,
      },
    } as Partial<Message>) as any, {
      context: {
        state: 'start',
      },
    } as any);

    expect(send.mock.calls[0]).toEqual(['It\'s a response!', { disableEveryone: true }]);
    expect(send.mock.calls[1]).toEqual(['Almost there :)', { disableEveryone: true }]);
    expect(send).toHaveBeenCalledTimes(2);
  });

  it('next -> done', async () => {
    const send: any = jest.fn().mockImplementationOnce(() => ({ id: 'reply1' }));

    mockedUpdate.mockImplementationOnce(async function(
      channelId: string,
      userId: string,
      context: object,
      messageIds: string[]
    ) {
      expect(channelId).toBe('text');
      expect(userId).toBe('test');
      expect(context).toEqual({
        state: 'done',
      });
      expect(messageIds).toEqual(['test-message3', 'reply1']);
    } as any);

    mockedFinish.mockImplementationOnce(async function(
      channelId: string,
      userId: string,
    ) {
      expect(channelId).toBe('text');
      expect(userId).toBe('test');
    } as any);

    await processMachine(example1, ({
      id: 'test-message3',
      author: {
        id: 'test',
      },
      channel: {
        id: 'text',
        send,
      },
    } as Partial<Message>) as any, {
      context: {
        state: 'next',
      },
    } as any);

    expect(send).toHaveBeenCalledWith('It\'s a another response!', { disableEveryone: true });
    expect(send).toHaveBeenCalledTimes(1);
  });
});
