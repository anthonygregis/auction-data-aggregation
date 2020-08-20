# WoW Auction House Data Aggregation

This component of my project is designed to connect to my site's database, and parse/store all the auction house transactions on WoW. It uses the connectedRealm table to grab all currently logged connected realm's and get auction house on each refresh (1 hour). I query the api endpoint that returns roughly 141k listings, depending on current auction house traffic. I scrap it for the item id, buyout price, quantity listed and save that as a row in my pricingData table. That table is used to the store the hourly data of the auction houses for the last 14 days.

## What it includes

* Sequelize
* Axios
* Async Iterators (Keeping track of sequelize transactions)
* Time Tracking (Goes off every hour on the hour)

### pricingData Model

| Column Name     | Data Type     | Notes                          |
| --------------- | ------------- | ------------------------------ |
| id              | Integer (PK)  | Generic ID                     |
| unitPrice       | BIGINT        | Buyout price of listing        |
| Quantity        | Integer       | Amount of an item listed       |
| connectedRealm  | Integer (FK)  | Server hosting realms / auction|
| itemId          | Integer (FK)  | Item used in the listing       |
| createdAt       | Date          | Auto-generated                 |
| updatedAt       | Date          | Auto-generated                 |

### Coding Steps

1. Connect to database through sequelize
2. Grab all connectedRealms and their auction house endpoint
3. .forEach through all connectedRealms
4. Axios.get request the auction house data and return as a result
5. Use an async / await iterator to parse through all rows of data and commit to database
