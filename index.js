const puppeteer = require('puppeteer')
const fs = require('fs')

const getData = async () => {
    const PAGES = 24
    const browser = await puppeteer.launch({ headless: false })

    const pagesPromises = Array.from({ length: PAGES }).map((_, index) => {
        return new Promise(async (resolve, reject) => {
            const page = await browser.newPage()
            const URL = `https://www.thefork.fr/search/?cityId=326512&p=${index + 1}`
            await page.goto(URL)

            const results = await page.evaluate(() => {
                const cards = document.querySelectorAll(".card")
                const restaurants = [...cards].map(card => {
                    return {
                        name: card.querySelector("h2 a").innerText,
                        link: card.querySelector("h2 a").href,
                        address: card.querySelector(".content .css-rttism.eulusyj0")?.innerText.replace('\n', ' '),
                        price: parseInt(card.querySelector('.content .css-1qqp6e8.eulusyj0')?.innerText.replace(/^\D+/g, '')),
                        rate: parseFloat(card.querySelector('.content .css-13xokbo.e7dhrrp0 span')?.innerText.replace(',', '.')),
                        images: card.querySelector('img').src
                    }
                })
                return restaurants
            })

            resolve(results)
        })
    })

    Promise.all(pagesPromises).then(values => {
        browser.close()
        fs.writeFileSync('dist/data.json', JSON.stringify(values.flat(), null, 2))
    })
}

getData()