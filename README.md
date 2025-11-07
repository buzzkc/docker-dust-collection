# Dust Collector Stack (Docker Compose)

This project sets up a self-hosted IoT environment using Docker Compose, including:

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
| Node-RED          | 1880  |
| ESPHome           | 6052  |
| MQTT Explorer Web       | 8083  |

## Data Persistence

Data is saved in mapped subfolders of each service.

Inspect volumes:

```
docker volume inspect <volume_name>
```


## Troubleshooting

| Issue                     | Possible Fix |
|---------------------------|---------------|
| `TZ` not applied          | Ensure `.env` is in same dir as docker-compose.yml |
| Dashboard links broken    | Check container ports and firewall |
| MQTT connection fails     | Verify port matches for container mapping |
| Node-RED unauthorized     | Reset password in settings.js inside Node-RED container |
| Node-RED permissions issue| chown the nodered folder to 1000:1000 |

## Node-RED Flow Management

- You may update the basetopic variable and MQTT connection information in the imported flows, but you'll need to update them on the device configurations in ESPHome also.
- Use the DC Configuration page to layout dust collection system, click Save Configuration to export configuration to NodeRed. The Configuration URL should just be the url for the NodeRed instance, no trailing slash: http://<NODE_RED_IP>:<NODE_RED_PORT> 

## Notes

- Dashboard auto-detects host IP — no hardcoding URLs. Update the array on index.html to add/remove services and additional links.
- Edit `nginx/index.html` to customize links/branding.
- Update containers with `docker compose pull`.
- Can refer to container names (nginx, mosquitto, esphome, mqttx) when pointing one container to another, instead of IP, in some cases as they know about one another.
- For MQTT messages, my default base topic is "buzzkc/dc", no trailing "/" should be used when updating this in flows or examples. Change it to your preference.
- Searching MQTT messages you can use wild cards (# and +) in filters. The nodered flow should receive all messages using "buzzkc/dc/#".

## To-Dos
- Load all configs and ports from .env and update configurations for flows, and esphome.
- Add authentication to services, currently no login needed, except for HA.
- Document MQTT messages and flows


**Author:** BuzzKC  
**License:** Apache License 2.0  
