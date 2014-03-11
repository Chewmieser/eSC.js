![AtarzaLogo](http://static.atarza.com/content/uploads/2013/04/atarzaHeader.png) [ eSC.js - A replacement eShopConnect ]
----

eSC.js is a node service that polls and updates Magento and ConnectedBusiness. In it's first release, it handles functionality that worked in eShopConnect:

- Polls Magento for new orders
- Looks up user, contact and shipTo in ConnectedBusiness
- Creates SalesOrder, SalesOrderDetails and Payment information in ConnectedBusiness

Beyond eShopConnect
----
The majority of eShopConnect (beyond polling / inital SO creation) never worked for us. Going forward, we plan to slowly re-incorporate that functionality into eSC.js, starting with:
- Shipping in Magento
- Invoicing in Magento
- Manipulating SO's in ConnectedBusiness

Node modules utilized
----
- **soap** - Connects to Magento's SOAP_v2 API
- **tedious** - Connects to ConnectedBusiness's MSSQL database
- **colors** - Colorful console logging

License
----
Although the source is currently opensource, it is not currently licensed for use outside Atarza's network. For more information, please contact us through atarza.com