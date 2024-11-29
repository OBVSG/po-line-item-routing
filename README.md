<a href="https://developers.exlibrisgroup.com/appcenter/po-line-item-routing/">![CloudApp Activations](<https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fapps01.ext.exlibrisgroup.com%2Fappstats.json&query=%24%5B%3F(%40.cloud_app_id%3D%3D'obvsg%2Fpo-line-item-routing')%5D.user_count&style=flat&label=Cloud%20App%20Activations>)</a>
<a href="https://developers.exlibrisgroup.com/appcenter/po-line-item-routing/">![Deployed Version](<https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fapps01.ext.exlibrisgroup.com%2Fapps.json&query=%24%5B%3F(%40.id%3D%3D'obvsg%2Fpo-line-item-routing')%5D.version&label=Deployed%20Version&color=green>)</a>

# PO Line Item Routing

This cloud app integrates with the Alma system to manage PO line items efficiently. It offers two main features:

**Sorting Interested Users:** Easily organize users who are interested in a specific item.

**Start Routing for a Specific Item:** Initiate the routing process for any item.

## Routing Modes

Item routing between interested users can be performed in two distinct modes:

**"Ring" Mode:**
In "Ring" mode, the item is loaned to the first user, who then manually passes it along to the next user on the list, independent of the Alma system. Upon initiating the routing, a PDF document listing all interested users is generated and available for download.

**"Star" Mode:**
In "Star" mode, the item is loaned to the first user, then returned, and subsequently loaned again to the next user in the list. This mode automates the process, creating requests for all interested users and setting up the initial loan for the first user. Printing should be done using Alma Letters.

## Development

Pre-requisites

- Node.js v14
- NPM v6

```sh
# install Node.js
nvm install && nvm use

# install dependencies
npm install

# install eca cli
npm install -g @exlibris/exl-cloudapp-cli

# For any issues
eca update
```

start the development server:

```sh
npm start
```

### Mirroring and Token Information

This repository is mirrored to [GitHub](https://github.com/OBVSG/po-line-item-routing) using GitLab's mirroring functionality. Any changes made here will be automatically reflected in the corresponding GitHub repository.

**Important Note:** The authentication token used for mirroring is set to expire at the end of 2024 (December 31st, 2024). To ensure uninterrupted mirroring beyond this date, please update the token before its expiration.
ensure uninterrupted mirroring beyond this date, please update the token before its expiration.
