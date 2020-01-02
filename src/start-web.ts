import Hapi, { Request, ResponseToolkit }    from '@hapi/hapi'
import {
  Wechaty, Message,
}               from 'wechaty'

import {
  log,
  PORT,
}             from './config'
import { chatops } from './coupling/chatops'
import { sendmes } from './coupling/sendmes'
import { mesalias } from './coupling/mesalias'
import { sendpic } from './coupling/sendpic'

let wechaty: Wechaty

async function chatopsHandler (request: Request, response: ResponseToolkit) {
  log.info('startWeb', 'chatopsHandler()')

  const payload: {
    chatops: string,
  } = request.payload as any

  await chatops(wechaty, payload.chatops)

  return response.redirect('/')
}

async function sendmesHandler (request: Request, response: ResponseToolkit) {
  log.info('startWeb', 'sendmesHandler()')

  const payload: {
    text: string,
    toId: string,
  } = request.payload as any

  await sendmes(payload.text, payload.toId)

  return response.redirect('/')
}

async function mesaliasHandler (request: Request, response: ResponseToolkit) {
  log.info('startWeb', 'mesaliasHandler()')

  const payload: {
    text: string,
    toId: string,
    change: string,
  } = request.payload as any

  await mesalias(payload.text, payload.toId, payload.change)

  return response.redirect('/')
}

async function sendpicHandler (request: Request, response: ResponseToolkit) {
  log.info('startWeb', 'sendpicHandler()')

  const payload: {
    url: string,
    toId: string,
  } = request.payload as any

  await sendpic(payload.url, payload.toId)

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

  const getMessageHtml = (mes: Message, saying: string, abb: string, color:string) => {
    const from = mes.from()
    // <label for="sendmes">${saying}</label>
    return `
      <form action="/sendmes/" method="post" style="display:inline">
        <input id="${mes.id}" type="hidden" name="text" value="${saying}" >
        <input id="${mes.id}" type="hidden" name="toId" value="${(from && from.id) || ''}">
        <input type="submit" value="${abb}" title="${saying}" style="width:10%;height:40px;background-color: #${color};border-radius:5px;color:#575169;margin:0 0.5% 0.5% 0">
      </form>
    `
  }

  const SendHtml = (mes: Message, saying: string, abb: string, color:string) => {
    const from = mes.from()
    // <label for="sendmes">${saying}</label>
    return `
      <form action="/sendmes/" method="post">
        <input id="${mes.id}" type="text" name="text" value="${saying}" style="width:86%;height:40px;background-color: #f9f5ea;border-radius:5px;color:#ffffff;margin:0 0.5% 0.5% 0">
        <input id="${mes.id}" type="hidden" name="toId" value="${(from && from.id) || ''}">
        <input type="submit" value="${abb}" title="${saying}" style="width:10%;height:40px;background-color: #${color};border-radius:5px;color:#575169;margin:0 0.5% 0.5% 0">
      </form>
    `
  }

  const ChangeHtml = (mes: Message, saying: string, abb: string, color:string, alias:string) => {
    const from = mes.from()
    // <label for="sendmes">${saying}</label>
    return `
      <form action="/mesalias/" method="post" style="display:inline">
        <input id="${mes.id}" type="hidden" name="text" value="${saying}" >
        <input id="${mes.id}" type="hidden" name="toId" value="${(from && from.id) || ''}">
        <input id="${mes.id}" type="hidden" name="change" value="${(alias) || ''}">
        <input type="submit" value="${abb}" title="${saying}" style="width:10%;height:40px;background-color: #${color};border-radius:5px;color:#575169;margin:0 0.5% 0.5% 0">
      </form>
    `
  }

  const SendpicHtml = (mes: Message, saying: string, abb: string, color:string) => {
    const from = mes.from()
    // <label for="sendmes">${saying}</label>
    return `
      <form action="/sendmes/" method="post" style="display:inline">
        <input id="${mes.id}" type="hidden" name="url" value="${saying}" >
        <input id="${mes.id}" type="hidden" name="toId" value="${(from && from.id) || ''}">
        <input type="submit" value="${abb}" title="${saying}" style="width:10%;height:40px;background-color: #${color};border-radius:5px;color:#575169;margin:0 0.5% 0.5% 0">
      </form>
    `
  }

  const handler = async () => {
    let html

    if (qrcodeValue) {

      html = [
        `<image src="https://phaedodata-1253507825.cos.ap-beijing.myqcloud.com/QijiBot/Wait.png" style="width:100%">`,
        '\n\n',
        '<div align="center">',
        '<image src="',
        'https://api.qrserver.com/v1/create-qr-code/?data=',
        encodeURIComponent(qrcodeValue),
        '">',
        '</div>',
      ].join('')

    } else if (userName) {
      let MessageList = await bot.Message.findAll()
      let MessageHtml = ``
      for (let mes of MessageList) {
        if (mes.from()?.name() !== userName) {
          const what = mes.text()
          const who = mes.from()?.name()
          const OneOne = getMessageHtml(mes, '您好！我叫尹伯昊，目前在和陆奇博士一起通过投资的方式构建早期创业生态，我自己也是一名教育AI的创业者。\n奇绩创坛前身是YC中国。希望通过【一笔标准化投资、三个月陆奇博士亲自参与的加速营、触达上千位一线投资人的路演日】的方式，用投资的方式帮助创业者越过早期创业的艰难。', '加好友第一条', 'f9f5ea')
          const OneTwo = getMessageHtml(mes, '您是创业者嘛？如果是的话，您可以具体介绍一下您的项目嘛？比如项目发展到什么阶段了、是否有融资需求等，我会尽我所能提供帮助。', '加好友第二条', 'f9f5ea')
          const OneThree = getMessageHtml(mes, '我们对于项目是没有要求的，以我们刚刚结束的第一期创业营为例，其中既有像脑机接口这样的硬科技项目、也有像鱼塘物联网设备这样的技术落地项目、还有像中老年人帮子女相亲的社区这样的C端项目。', '对项目没有要求', 'f9f5ea')
          const OneFour = getMessageHtml(mes, '我们第一期的很多项目实际上都很优秀，但是因为我们第一期的规模有限没有办法邀请所有项目进入创业营，而我们这一期将会扩招，相信您的项目有机会成为其中之一。', '为什么上一期落选', 'f9f5ea')
          const OneFive = ChangeHtml(mes, '您可以介绍一下您的项目嘛？我们很期待触达更多的创业者并帮助他们融资。', '邀请介绍项目 / 感兴趣', 'ede1d9', '感兴趣-')
          const TwoOne = getMessageHtml(mes, '我们期望帮助真正的早期创业者，像我们上一期实际上就投资了一家做纳米新材料癌症诊断的公司，报名时甚至他们还没有注册公司。\n填写我们的报名表实际上也是帮助您和您的团队梳理商业模式的好机会，我们很欢迎您的填写。', '产品还没上线', 'f9f5ea')
          const TwoTwo = getMessageHtml(mes, '我们期望帮助真正的早期创业者，像我们上一期实际上就投资了很多家需要大量资金或者还没有找到盈利点的项目，期待帮助他们走过早期创业的艰难。\n只要您相信您产品的价值，就完全有机会参与我们的创业营，我们很欢迎您的填写。', '产品还没盈利', 'f9f5ea')
          const TwoThree = getMessageHtml(mes, '其实不缺资金或者刚刚融完资的项目非常适合来申请我们加速营。\n在接下来的几个月里，我们会在陆奇博士的亲自参与下重点帮助你们做战略规划、做增长、技术指导、参与组织文化、市场、产品等业务，在5月会帮您对接给近千位顶级投资人，其实比较符合A轮附近项目的发展节奏。\n去年新核云、斯坦德机器人都是刚融资完进入的加速营，他们都在三个月内实现了超过300%的增长，现在他们的融资也很顺利，像斯坦德机器人就获得了超预期一倍的融资，估值现在已经超过5亿。', '公司不缺钱', 'f9f5ea')
          const TwoFour = getMessageHtml(mes, '我们不看BP，并选择了一种更简单明快的投资方式：填写完整报名表之后，我们会选择部分优秀的项目进行面试，如果觉得合适会很快确认投资。', '我们不看BP', 'f9f5ea')
          const TwoFive = ChangeHtml(mes, '我们的创业营是免费的，还会为创业者提供20万美金换取5%的股份。\n这是我们的报名渠道：apply.miracleplus.com。\n我们非常欢迎您的报名！并愿意与您一起走过早期创业的艰难。', '邀请填写报名 / 转化中', 'ede1d9', '转化中-')
          const ThreeOne = getMessageHtml(mes, '嗯嗯，报名过程中有问题可以随时联系我[Hey]我会尽我可能提供帮助。', '有问题随时联系我', 'f9f5ea')
          const ThreeTwo = getMessageHtml(mes, '嗯嗯，其实我们的流程是很简单的，在填写完整报名表之后，我们会选择部分优秀的项目进行面试，如果觉得合适会很快确认投资。\n而报名表确实有一定的信息量，我们相信其除了能更好地帮助我们进行决策，也能够帮助您和您的团队梳理商业模式，我们认为这对于我们双方都是值得的。', '觉得流程太长', 'f9f5ea')
          const ThreeThree = getMessageHtml(mes, '我们会按20万美金占股5%的方式进行标准估值投资。\n我们第一期的项目很多都已经走到B轮，基本上都是按照这个价格参与的加速营。我们团队一定是能提供超过5%股份的价值，这是陆奇博士、也是我们的价值观。\n所以可能估值这一部分我们讨论的空间不是特别大[皱眉]。', '觉得估值太低', 'f9f5ea')
          const ThreeFour = ChangeHtml(mes, '非常感谢您的报名！我们团队会在2020年2月完成审核和面试邀请，期待着到时候与您见面！更期待着能在三月与您一起参与我们的创业营！', '完成报名 / 已提交', 'ede1d9', '已提交-')
          const ThreeFive = getMessageHtml(mes, '嗯嗯，我们会在2020年2月确定投资，2020年3月到5月举行创业营，这段时间您可以专心发展业务，有任何进展我们都会联系您。', '会在什么时候投资', 'f9f5ea')
          const FourOne = ChangeHtml(mes, '嗯嗯，那可能确实很多地方没有那么合适。但是我们可以长期保持联系！\n祝您工作顺利！', '确认无意愿 / 无意愿', 'ede1d9', '无意愿-')
          const FourTwo = SendpicHtml(mes, 'https://phaedodata-1253507825.cos.ap-beijing.myqcloud.com/YCCooperate/WechatIMG9.jpeg', '发图片', 'f9f5ea')
          const Person = [
            `<p>`,
            `<p style="display:inline;margin:0px 10px 0px 0px">`,
            who,
            '</p>',
            `<p style="display:inline;color:#555555">`,
            what,
            '</p>',
            '</p>',
          ].join('')
          const FORM_HTML = SendHtml(mes, '', '立刻回复', 'ede1d9')
          MessageHtml = Person + OneOne + OneTwo + OneThree + OneFour + OneFive + TwoOne + TwoTwo + TwoThree + TwoFour + TwoFive + ThreeOne + ThreeTwo + ThreeThree + ThreeFour + ThreeFive + FourOne + FourTwo + FORM_HTML + MessageHtml + '<p>\n\n</p>'
        }

        html = [
          `<image src="https://phaedodata-1253507825.cos.ap-beijing.myqcloud.com/QijiBot/InUse.png" style="width:100%">`,
          `<div style="width:90%;position:absolute;left:4%">`,
          `<p>`,
          `<p style="display:inline"> 正在登录 </p>`,
          `<p style="display:inline"> ${userName}  </p>`,
          `</p>`,
          `<p style="color:#d5d5d5">最新消息</p>`,
          MessageHtml,
          `<p style="color:#d5d5d5">最早消息</p>`,
          `</div>`,
        ].join('')
      }
    } else {

      html = `<image src="https://phaedodata-1253507825.cos.ap-beijing.myqcloud.com/QijiBot/Black.png" style="width:100%">`

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

  server.route({
    handler: sendmesHandler,
    method : 'POST',
    path   : '/sendmes/',
  })

  server.route({
    handler: mesaliasHandler,
    method : 'POST',
    path   : '/mesalias/',
  })

  server.route({
    handler: sendpicHandler,
    method : 'POST',
    path   : '/sendpic/',
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
