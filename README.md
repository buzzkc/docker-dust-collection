# Dust Collector Stack (Docker Compose)

This project sets up a self-hosted IoT environment using Docker Compose, including:

- Home Assistant — Smart home automation hub
- Node-RED — Visual automation and logic flows
- ESPHome — Device management and firmware for ESP devices
- EMQX MQTT Broker — MQTT messaging server
- MQTT Explorer Web — Web-based MQTT client
- Dashboard (NGINX) — Simple homepage with links to all services

Specifically the environment is for controlling a dust collection system I run from ESP devices setup from ESPHome.

## Folder Structure

```
.
project-root/
├── .env                     # environment variables for all containers
├── docker-compose.yml       # main Docker Compose stack
├── nginx/
│   └── index.html           # dashboard homepage with links to services
├── nodered/
│   └── flows.json           # Node-RED flows
├── homeassistant/
│   └── configuration.yaml   # Home Assistant config
├── esphome/
│   └── ...                  # ESPHome device configs
├── mosquitto/
│   ├── config/              # Mosquitto configuration files
│   ├── data/                # persistent broker data
│   └── log/                 # broker logs
├── mqtt-explorer/			 # MQTT Explorer Web UI
│   └── config/             
└── README.md                # project documentation
```

## Configuration

### Quick Start

```bash
# Clone repo
git clone https://github.com/yourusername/docker-dust-collector.git
cd docker-dust-collector

# Create .env
cp .env_dist .env

# Start stack
docker compose up -d

# Open dashboard
http://<your-server-ip>
```

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

### Updating


Stop the stack:

```
docker compose down
```

Pull Latest Updates:

```
git pull
```

Start the stack:

```
docker compose up -d
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
| ESPHome           | 6052  |
| MQTT Explorer Web       | 8083  |

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

- You'll need to updated the basetopic variable and MQTT connection information in the imported flows.
- Two configuration flows exist that import dc-config.json, one from a URL (such as github) and one from the local nodered data folder. Whichever you choose to use, enable the trigger and set it to update every 5 minutes or so.
- Updating dc-config.json can be done directly or using a visualization tool like: https://todiagram.com/editor

## Notes

- Dashboard auto-detects host IP — no hardcoding URLs. Update the array on index.html to add/remove services and additional links.
- Edit `nginx/index.html` to customize links/branding.
- Update containers with `docker compose pull`.
- Can refer to container names (nginx, mosquitto, esphome, homeassistant, mqttx) when pointing one container to another, instead of IP, in some cases as they know about one another.
- For MQTT messages, my default base topic is "buzzkc/dc", no trailing "/" should be used when updating this in flows or examples. Change it to your preference.
- Searching MQTT messages you can use wild cards (# and +) in filters. The nodered flow should receive all messages using "buzzkc/dc/#".

## To-Dos
- Load all configs and ports from .env and update configurations for flows, esphome, and home assistant.
- Add authentication to services, currently no login needed, except for HA.
- Add web based editor for dc-config.json.
- Add controller, tool, and gate examples to ESPHome.
- Document MQTT messages and flows
- Make HA optional, not really needed since ESPHome is its own container, but nice to have the extra automation/ui features.


**Author:** BuzzKC  
**License:** MIT  
