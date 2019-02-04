import { ArgumentParser } from 'argparse';
import * as cheerio from 'cheerio';
import { createWriteStream } from 'fs';
import requestPromise = require('request-promise');

const url = 'https://magic.wizards.com/en/articles/archive/mtgo-standings/competitive-modern-constructed-league-'
  + '2019-02-01';

interface Card {
  name: string;
  count: number;
}

function parseCardsList(html: string): Card[] {
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

  return cardsList;
}

function writeToFile(cardsList: Card[], filename: string): void {
  console.log(`Writing results to ${filename}.`);
  const stream = createWriteStream(filename);

  for (const card of cardsList) {
    stream.write(`${card.name},${card.count}\n`);
  }

  stream.end();
  console.log('Finished writing.');
}

const parser = new ArgumentParser({
  addHelp: true,
  description: process.env.npm_package_description,
  version: process.env.npm_package_version
});

parser.addArgument(['-o', '--output'], {
  defaultValue: './sideboard.csv',
  help: 'Filename where you want to save the results (csv).'
});

const args = parser.parseArgs();

requestPromise(url).then((html: string) => {
  const cardsList = parseCardsList(html);
  writeToFile(cardsList, args.output);
}).catch((err: any) => {
  console.error(err);
});
