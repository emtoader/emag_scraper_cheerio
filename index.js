const cheerio = require('cheerio');
const { default: axios } = require('axios');
const { convertArrayToCSV } = require('convert-array-to-csv');
const fs = require("fs").promises;

const delay = require('delay');

const DATASET = [];



(async () => {
  const VENDOR_NAME = '' // check emag url
  const URI = 'https://www.emag.ro/vendors/vendor/'+VENDOR_NAME;
  const PAGES = 5;
  const DELAY = 2000; //set your own delay in order to avoid getting blocked

  for (let i = 1; i <= PAGES; i++) {
    const URI_WITH_PAGE = URI + `/p${i}`;

    const response = await axios.get(URI_WITH_PAGE);

    let $ = cheerio.load(response.data);

    // CHECK IF SITE IS LOADED

    let $cardItems = $('#card_grid').find('.card-item').toArray();

    for (const [i, $cardItem] of $cardItems.entries()) {
      console.log(`PRODUCT ${i}`);
      const DATA = { description: '' };

      // NAMES
      DATA.name = $($cardItem).find('.product-title').text().trim();

      // PRICES
      let price = $($cardItem).find('.product-new-price').text().trim();

      price = price.replace(' Lei', '');
      price = price.slice(0, -2);

      DATA.price = price;

      // IMAGES
      DATA.image = $($cardItem).find('.thumbnail img').attr('src');

      // LINKS
      const LINK = $($cardItem).find('.product-title-zone > a').attr('href');

      DATA.link = LINK;

      // DESCRIPTIONS

      await delay( DELAY + Math.floor(Math.random() * 6) + 1  );

      const response = await axios.get(LINK);

      const $productPage = cheerio.load(response.data);

      $productPage('.product-page-description-text > div > p').each(
        function () {
          DATA.description = DATA.description.concat(
            $productPage(this).text().trim() + ' '
          );
        }
      );

      $productPage('.breadcrumb li').each(
        function () {

          var text = $productPage(this).text().trim()

          DATA.category += text+' > '
        }
      );

      // CATEGORY
      // Uncomment in case you need category information

      //DATA.category = $productPage('.breadcrumb').children().last().text();
      //DATA.category = $productPage('.breadcrumb').text();

      // var tempcategory = $productPage('.breadcrumb li').contents().map(function() {
      //     return (this.type === 'text') ? $(this).text()+' ' : $(this).text();
      // }).get().join(' > ');

      // DATA.category = tempcategory;

      DATASET.push(DATA);

      // var TEMPDATASET = []

      // TEMPDATASET[0] = DATA

      // var csvDataTemp = convertArrayToCSV(TEMPDATASET);
      // await fs.appendFile('tempdata.csv', csvDataTemp);

    }

    await delay(DELAY);
  }
  const csvData = convertArrayToCSV(DATASET);

  await fs.writeFile('data-'+VENDOR_NAME+'.json', JSON.stringify(DATASET));
  await fs.writeFile('data-'+VENDOR_NAME+'.csv', csvData);

  console.log('END');
})();
