# Dust Collector Stack (Docker Compose)

This project sets up a self-hosted IoT environment using Docker Compose, including:

- Home Assistant — Smart home automation hub
- Node-RED — Visual automation and logic flows
- ESPHome — Device management and firmware for ESP devices
- EMQX MQTT Broker — MQTT messaging server
- MQTTX Web — Web-based MQTT client
- Dashboard (NGINX) — Simple homepage with links to all services

## Folder Structure

```
.
├── docker-compose.yml
├── .env
├── nginx/
│   └── index.html
└── README.md
```

## Configuration

### .env File

Create a `.env` file in the project root with your environment variables:

```
TZ=America/New_York
NODE_RED_USER=admin
NODE_RED_PASSWORD=changeme
```

### Usage

Start the stack:

```
docker compose up -d
```

Stop the stack:

```
docker compose down
```

View logs:

```
docker compose logs -f
```

## Web Interfaces

Open your browser and visit your host’s IP or hostname:

```
http://<your-server-ip>
```

| Service           | Port  |
|------------------|-------|
| Dashboard (NGINX) | 80    |
| Home Assistant    | 8123  |
| Node-RED          | 1880  |
| ESPHome           | 6052  | |
| MQTTX Web         | 8083  |

## Data Persistence

| Service        | Volume Name       | Description                  |
|----------------|-----------------|-------------------------------|
| Home Assistant | ha_config        | Home Assistant configuration  |
| Node-RED       | nodered_data     | Node-RED flows and data       |
| ESPHome        | esphome_config   | ESPHome device configs        |
| EMQX           | emqx_data        | MQTT broker data              |

Inspect volumes:

```
docker volume inspect <volume_name>
```


## Troubleshooting

| Issue                     | Possible Fix |
|---------------------------|---------------|
| `TZ` not applied          | Ensure `.env` is in same dir as docker-compose.yml |
| Dashboard links broken    | Check container ports and firewall |
| MQTT connection fails     | Verify `.env` credentials match ESPHome/Home Assistant |
| Node-RED unauthorized     | Reset password in settings.js inside Node-RED container |

## Node-RED Flow Management

You'll need to updated the basetopic variable and MQTT connection information in the imported flows.

There are two configuration flows that import dc-config.json, one from a URL (such as github) and one from the local nodered data folder. Whichever you choose to use, enable the trigger and set it to update every 5 minutes or so.

## Notes

- Dashboard auto-detects host IP — no hardcoding URLs.
- Edit `nginx/index.html` to customize links/branding.
- Update containers with `docker compose pull`.

## Quick Start

```bash
# Clone repo
git clone https://github.com/yourusername/docker-dust-collector.git
cd smart-home-stack

# Create .env
cp .env.example .env

# Start stack
docker compose up -d

# Open dashboard
http://<your-server-ip>
```

**Author:** BuzzKC  
**License:** MIT  
