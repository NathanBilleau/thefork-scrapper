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

            const results = await page.evaluate(async () => {
                const cards = document.querySelectorAll(".card")
                const restaurants = []
                for (const card of cards) {
                    const address = card.querySelector(".content .css-rttism.eulusyj0")?.innerText.replace('\n', ' ')
                    const image = card.querySelector('img').src
                    const price = parseInt(card.querySelector('.content .css-1qqp6e8.eulusyj0')?.innerText.replace(/^\D+/g, ''))
                    const rate = parseFloat(card.querySelector('.content .css-13xokbo.e7dhrrp0 span')?.innerText.replace(',', '.'))

                    let geo = {
                        longitude: null,
                        latitude: null
                    }

                    if (address) {
                        const response = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${address}`)
                            .then(res => res.json())
                            .catch(err => {
                                console.error(err)
                            })

                        if (response?.features?.length > 0) {
                            geo = {
                                latitude: response?.features[0]?.geometry?.coordinates[0],
                                longitude: response?.features[0]?.geometry?.coordinates[1]
                            }
                        }
                    }

                    if (image && address && price && rate && geo.longitude && geo.latitude) {
                        restaurants.push({
                            name: card.querySelector("h2 a").innerText,
                            link: card.querySelector("h2 a").href,
                            address,
                            ...geo,
                            price,
                            rate,
                            image
                        })
                    }
                }
                return Promise.all(restaurants)
            })

            await page.close()
            resolve(results)
        })
    })

    Promise.all(pagesPromises).then(values => {
        browser.close()
        fs.writeFileSync('dist/data.json', JSON.stringify(values.flat(), null, 2))
    })
}

getData()