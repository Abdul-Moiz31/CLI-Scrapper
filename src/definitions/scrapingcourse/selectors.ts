// css selectors for scrapingcourse.com/ecommerce, by page type

export const listSelectors = {
  itemLink: "li.product a.woocommerce-loop-product__link",
  nextPage: "a.next.page-numbers",
};

export const detailSelectors = {
  name: "h1.product_title",
  price: ".summary.entry-summary p.price",
  sku: ".sku_wrapper .sku",
  category: ".posted_in a",
};
