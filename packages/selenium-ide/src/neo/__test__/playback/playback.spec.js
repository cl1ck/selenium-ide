// Licensed to the Software Freedom Conservancy (SFC) under one
// or more contributor license agreements.  See the NOTICE file
// distributed with this work for additional information
// regarding copyright ownership.  The SFC licenses this file
// to you under the Apache License, Version 2.0 (the
// "License"); you may not use this file except in compliance
// with the License.  You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

import Playback, { PlaybackEvents, CommandStates } from '../../playback/playback'
import FakeExecutor from '../util/FakeExecutor'

describe('Playback', () => {
  describe('Playback test queue', () => {
    it('should play a test', async () => {
      const test = [
        {
          command: 'open',
          target: '',
          value: '',
        },
        {
          command: 'open',
          target: '',
          value: '',
        },
        {
          command: 'open',
          target: '',
          value: '',
        },
      ]
      const executor = new FakeExecutor({})
      executor.doOpen = jest.fn(async () => {})
      const playback = new Playback({
        executor,
      })
      await playback.play(test)
      expect(executor.doOpen).toHaveBeenCalledTimes(3)
    })

    it('should fail to play a test with an unknown command', async () => {
      const test = [
        {
          command: 'fail',
          target: '',
          value: '',
        },
      ]
      const executor = new FakeExecutor({})
      const playback = new Playback({
        executor,
      })
      return expect(playback.play(test)).rejects.toBeInstanceOf(Error)
    })

    it('should pass a test with a failing verify', async () => {
      const test = [
        {
          command: 'verifyText',
          target: '',
          value: '',
        },
      ]
      const executor = new FakeExecutor({})
      executor.doVerifyText = jest.fn(async () => {
        throw new Error('failed to verify')
      })
      const playback = new Playback({
        executor,
      })
      expect(async () => await playback.play(test)).not.toThrow()
    })
  })

  describe('Events', () => {
    describe("'command-state-changed'", () => {
      it('should listen to pending and pass changes', async () => {
        const test = [
          {
            command: 'open',
            target: '',
            value: '',
          },
        ]
        const executor = new FakeExecutor({})
        executor.doOpen = jest.fn(async () => {})
        const playback = new Playback({
          executor,
        })
        const cb = jest.fn()
        playback.on(PlaybackEvents.COMMAND_STATE_CHANGED, cb)
        await playback.play(test)
        const results = cb.mock.calls.flat()
        expect(results.length).toBe(2)
        expect(results[0].state).toBe(CommandStates.Pending)
        expect(results[1].state).toBe(CommandStates.Passed)
      })
      it('should listen to fail changes', async () => {
        const test = [
          {
            command: 'verifyText',
            target: '',
            value: '',
          },
        ]
        const executor = new FakeExecutor({})
        executor.doVerifyText = jest.fn(async () => {
          throw new Error('failed to verify')
        })
        const playback = new Playback({
          executor,
        })
        const cb = jest.fn()
        playback.on(PlaybackEvents.COMMAND_STATE_CHANGED, cb)
        await playback.play(test).catch(() => {})
        const results = cb.mock.calls.flat()
        expect(results.length).toBe(2)
        expect(results[0].state).toBe(CommandStates.Pending)
        expect(results[1].state).toBe(CommandStates.Failed)
      })
      it('should listen to fatal changes', async () => {
        const test = [
          {
            command: 'fatal',
            target: '',
            value: '',
          },
        ]
        const executor = new FakeExecutor({})
        const playback = new Playback({
          executor,
        })
        const cb = jest.fn()
        playback.on(PlaybackEvents.COMMAND_STATE_CHANGED, cb)
        await playback.play(test).catch(() => {})
        const results = cb.mock.calls.flat()
        expect(results.length).toBe(2)
        expect(results[0].state).toBe(CommandStates.Pending)
        expect(results[1].state).toBe(CommandStates.Fatal)
      })
    })
  })
})