# Data source: USDA ERS Weekly Retail Food Sales

| Item | Detail |
|---|---|
| Dataset | Weekly Retail Food Sales, national total and by product subcategory |
| Publisher | USDA Economic Research Service (ERS), built on Circana (formerly IRI) retail scanner data |
| Source page | https://www.ers.usda.gov/data-products/weekly-retail-food-sales |
| Documentation | https://www.ers.usda.gov/data-products/weekly-retail-food-sales/documentation |
| File used | https://www.ers.usda.gov/media/6554/weekly-retail-food-sales-national-total-and-by-product-subcategory.csv |
| Downloaded | 12 November 2026 (the notebook downloads it again on every run) |
| Status | Discontinued by USDA; files last updated 7 July 2023 |
| Series used | Category `Beverages`, subcategory `Water`, variable `Unit sales` (plus `Dollars`) |
| Coverage after processing | Weekly: week ending 2018-10-07 to 2023-05-07 (240 weeks). Monthly: Oct 2018 to Apr 2023 (55 complete months) |

## Raw file structure
The file is in long format, with columns `Date`, `Category`, `Subcategory`, `Variable` and `Value`, and has 152,280 rows. `Date` is the week-ending date (a Sunday). The variables are Dollars and Unit sales, each for the current week, last year and 3 years ago, plus shares and percent changes.

## Processing (`processed_monthly_sales.csv`)
1. Filter to Beverages / Water and pivot the variables to columns. The checks found no duplicate rows, no missing values, no non-positive values and no gaps in the weekly calendar.
2. **Extend the history.** The current-week series starts on 2019-10-06. USDA also publishes *Unit sales last year* and *Unit sales 3 years ago* for every week. These were mapped back 52 and 156 weeks and checked against the observed series where they overlap (maximum disagreement 0.022%). This extends the weekly history back to 2018-10-07.
3. **Weekly to monthly.** A week ending on D covers D-6 to D. Each day gets one seventh of the week's sales, and days are summed by calendar month.
4. **Boundary months.** Only months with every day covered are kept. May 2023 is partial, because the data ends on 7 May, so it is dropped. October 2018 starts on day 1 and is complete.
5. **Output columns:** `month` (first day of the month), `units`, `dollars`, `avg_price` (dollars / units).

## Proxy and integrity notes
- These are **US national category sales for all water products**. They are used as a demand proxy for a fictional new flavoured-water product. They are not that product's sales, and they are not regional data.
- The data is **historical** and ends in May 2023. It is not live 2026 data.
- **Redistribution:** the ERS pages state no licence. The underlying data is proprietary Circana scanner data published by USDA in aggregate form. This repository therefore ships only the derived monthly aggregate (`processed_monthly_sales.csv`), not the raw file. Use `python scripts/download_data.py` (or the notebook) to fetch the raw file from USDA.
- USDA notes that the series may be revised when Circana's methodology changes.
