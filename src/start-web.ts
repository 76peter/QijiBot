import Hapi, { Request, ResponseToolkit }    from '@hapi/hapi'
import {
  Wechaty,
}               from 'wechaty'

import {
  log,
  PORT,
  VERSION,
}             from './config'
import { chatops } from './chatops'

let wechaty: Wechaty

async function chatopsHandler (request: Request, response: ResponseToolkit) {
  log.info('startWeb', 'chatopsHandler()')

  const payload: {
    chatops: string,
  } = request.payload as any

  await chatops(wechaty, payload.chatops)

  return response.redirect('/')
}

export async function githubWebhookHandler (
  request: Request,
  response: ResponseToolkit,
) {
  log.info('startWeb', 'githubWebhookHandler()')

  const payload = request.payload as any

  log.verbose(JSON.stringify(payload))

  return response.response()
}

export async function startWeb (
  bot: Wechaty,
): Promise<void> {
  log.verbose('startWeb', 'startWeb(%s)', bot)

  let qrcodeValue : undefined | string
  let userName    : undefined | string

  wechaty = bot

  const server =  new Hapi.Server({
    port: PORT,
  })

  const FORM_HTML = `
    <form action="/chatops/" method="post">
      <label for="chatops">ChatOps: </label>
      <input id="chatops" type="text" name="chatops" value="Hello, BOT5.">
      <input type="submit" value="ChatOps">
    </form>
  `
  const handler = async () => {
    let html

    if (qrcodeValue) {

      html = [
        `<h1>BOT5 v${VERSION}</h1>`,
        'Scan QR Code: <br />',
        qrcodeValue + '<br />',
        '<a href="http://goqr.me/" target="_blank">http://goqr.me/</a><br />',
        '\n\n',
        '<image src="',
        'https://api.qrserver.com/v1/create-qr-code/?data=',
        encodeURIComponent(qrcodeValue),
        '">',
      ].join('')

    } else if (userName) {
      const process = require('process')
      const tencentcloud = require('tencentcloud-sdk-nodejs')
      const TbpClient = tencentcloud.tbp.v20190627.Client
      const models = tencentcloud.tbp.v20190627.Models
      const Credential = tencentcloud.common.Credential
      const ClientProfile = tencentcloud.common.ClientProfile
      const HttpProfile = tencentcloud.common.HttpProfile
      let cred = new Credential(process.env.TBP_SecretId, process.env.TBP_SecretKey)
      let httpProfile = new HttpProfile()
      httpProfile.endpoint = 'tbp.tencentcloudapi.com'
      let clientProfile = new ClientProfile()
      clientProfile.httpProfile = httpProfile
      let client = new TbpClient(cred, 'ap-beijing', clientProfile)
      let MessageList = await bot.Message.findAll()
      let MessageHtml = `The rooms I have joined are as follows: <ol>`
      for (let mes of MessageList) {
        const what = await mes.text()
        let req = new models.TextProcessRequest()
        let params = JSON.stringify({
          'BotEnv': 'release',
          'BotId': process.env.TBP_BotId,
          'InputText': what,
          'TerminalId': '1',
        })
        req.from_json_string(params)
        client.PullSmsReplyStatusByPhoneNumber(req, function (err:any, response:any) {
          if (err) {
            return
          }
          const answer = response.to_json_string()
          log.info(answer)
        })
        const who = await mes.from()?.name()
        MessageHtml = MessageHtml + `<li> ${who} / ${what} </li>\n`
      }
      MessageHtml = MessageHtml + `</ol>`

      html = [
        `<p> BOT5 v${VERSION} User ${userName} logined. </p>`,
        FORM_HTML,
        MessageHtml,
      ].join('')

    } else {

      html = `BOT5 v${VERSION} Hello, come back later please.`

    }
    return html
  }

  server.route({
    handler,
    method : 'GET',
    path   : '/',
  })

  server.route({
    handler: chatopsHandler,
    method : 'POST',
    path   : '/chatops/',
  })

  bot.on('scan', qrcode => {
    qrcodeValue = qrcode
    userName    = undefined
  })
  bot.on('login', user => {
    qrcodeValue = undefined
    userName    = user.name()
  })
  bot.on('logout', () => {
    userName = undefined
  })

  await server.start()
  log.info('startWeb', 'startWeb() listening to http://localhost:%d', PORT)
}
