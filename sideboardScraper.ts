import * as cheerio from 'cheerio';
import * as rp from 'request-promise';

const url = 'https://magic.wizards.com/en/articles/archive/mtgo-standings/competitive-modern-constructed-league-'
  + '2019-02-01';

interface Card {
  name: string;
  count: number;
}

rp(url).then((html: string) => {
  const $ = cheerio.load(html);
  const cards: {[name: string]: Card} = {};

  $('.sorted-by-sideboard-container .row').each((i, card) => {
    const cardCount = parseInt($(card).find('.card-count').text());
    const cardName = $(card).find('.card-name a').text();

    if (cardName in cards) {
      cards[cardName].count += cardCount;
    } else {
      cards[cardName] = {
        count: cardCount,
        name: cardName
      };
    }
  });

  const cardsList = Object.keys(cards).map((name) => cards[name]);
  cardsList.sort((a: Card, b: Card) => {
    if (a.count === b.count) {
      return a.name.localeCompare(b.name);
    }

    return b.count - a.count;
  });

  console.log(cardsList);
}).catch((err: any) => {
  console.error(err);
});
