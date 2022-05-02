# Onscoutline
Web app for integration data and publication statistics about football players playing in Czech Republic.

Web app was made as a practival part of a diploma thesis at [DIKE at Prague University of Economics and Business](https://kizi.vse.cz/english/).


Web App includes:
- FACR data extraction
- Extracted data processing (clean, transform, structure)
- Data save
- GraphQL API to publish processed data

## Links

- [Repo](https://github.com/dmitrijt9/onscoutline)
- [Docker Image](https://hub.docker.com/r/dimot9/onscoutline-api)
- [GraphQL API endpoint](https://api.onscoutline.dimot.dev/graphql)


## DEV

Development of the app is in Docker environment. 
It is better (because of IDE) to develop each service in a separate workspace.

### Prerequisities

- Docker
- Yarn3
- Create your .env.local file by copying .env file
### Start app

```
# Go to API service
cd services/api

# Run docker container
bin/start

# [In container] run the app with file watcher
yarn start:dev
```

## Data extraction

For data extraction there are multiple scripts that scrape FACR websites to get competitions, clubs, players and matches.

Each script in `package.json` starts witch prefix `scraper:`.

In case of clubs and matches it is needed to install chromium to the API container first.
```
# [In container] install chromium
yarn chrome:install
```

## GraphQL queries examples

<details>
<summary>Query Player</summary>

```graphql
query Player($playerId: ID!) {
  player(id: $playerId) {
    id
    playerInfo {
      positions
      transferRecords {
        clubFrom
        clubTo
        when
        event
      }
    }
    stats {
      hattricks
    }
  }
}

// variables example
{
  "playerId": "1005"
}
```
</details>

<details>
<summary>Query Players</summary>

```graphql
query Players($query: String!) {
  players(query: $query) {
    id
    personInfo {
      gender
    }
    playerInfo {
      shirt
    }
    parentClub {
      name
    }
    loanClub {
      name
    }
    stats {
      goalsPerGameRatio
    }
  }
}

// variables example
{
  "query": "Eliška"
}
```
</details>

<details>
<summary>Query PlayerStats</summary>

```graphql
query PlayerStats($playerId: ID!, $stat: PlayerStat!) {
  playerStats(playerId: $playerId, stat: $stat) {
    season
    value
  }
}

// variables example
{
  "playerId": "1186",
  "stat": "GoalsPerGameRatio"
}
```
</details>

<details>
<summary>Query Clubs</summary>

```graphql
query Clubs {
  clubs {
    id
    name
    url
  }
}
```
</details>


