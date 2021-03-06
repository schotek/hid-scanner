import test from 'ava'
import sinon from 'sinon'
import HID from 'node-hid'
import { EventEmitter } from 'events'
import fixture from './helpers/fixture'
import { Scanner } from '..'

const PRODUCT = 'FAKE_PRODUCT'
const PATH = 'FAKE_PATH'

test.beforeEach((t) => {
  const stubs = {
    devices: sinon.stub(HID, 'devices'),
    hid: sinon.stub(HID, 'HID'),
  }
  const hid = new EventEmitter()
  hid.close = sinon.spy()

  stubs.devices.returns([
    {
      product: 'foo',
      path: 'bar'
    },
    {
      product: PRODUCT,
      path: PATH,
    },
  ])
  stubs.hid.returns(hid)

  t.context.stubs = stubs
  t.context.hid = hid
  t.context.scanner = new Scanner(PRODUCT)
})

test.afterEach((t) => {
  t.context.stubs.devices.restore()
  t.context.stubs.hid.restore()
})

const macro = {
  async keymap (t, filename, expected) {
    const { scanner, hid } = t.context

    let string = ''
    scanner.on('key', ({ char }) => {
      if (!char) {
        return
      }
      string += char
    })
    scanner.on('error', () => {}) // TODO: remove it

    const hexes = await fixture(filename)
    hexes.split('\n').forEach((hex) => {
      hid.emit('data', Buffer.from(hex, 'hex'))
    })

    t.is(string, expected)
    t.pass()
  },
}

test.serial('call hid with the correct path of device', (t) => {
  t.true(t.context.stubs.hid.calledWith(PATH))
  t.pass()
})

test.serial('keymap 1', macro.keymap, '1.hex.txt',
  'https://mnzn.net/sod.ac/d/SD01234567\n')

test.serial('keymap 2', macro.keymap, '2.hex.txt',
  'https://github.com/imyelo?tab=overview&from=2018-12-01&to=2018-12-31\n')

test.serial('keymap3', macro.keymap, '3.hex.txt',
  '1234567890-=\\`qwertyuiop[]asdfghjkl;\'zxcvbnm,./ 	!@#$%^&*()_+|~QWERTYUIOP{}ASDFGHJKL:"ZXCVBNM<>?\n')
