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
│   ├── json-editor/ 		 # DC Configuration editor
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

## Services Cofiguration
In ESPHome, you'll want to add the floowing entries to your secrets file (button top right).
```
wifi_ssid: "<your_ssid>"
wifi_password: "<your_wifi_password>"
mqtt_broker: "<your_MQTT_serverIP>"
```

Add new devices to ESPHome, then update the device yaml to be for the type of device you are creating. You can copy the examples from the demo files. Install to update the device.

Once you have all your devices added, procede to configuration of the system.

In the DC Configuration page:
- Update the NodeRed URL to the http address of your NodeRed server (e.g. http://192.168.1.15:1880 )
- Drag and Drop the types of components that make up your dust collection system onto the canvas.
- Dragging Gates and Tool components onto a Collector component will create an association. As you drag the Gate or Tool away from the Collector, a line will appear showing the relationship.
- Dragging a Tool component or a Gate component onto another Gate Component will create a relationship as well. The component that is dragged will become the child component to the Gate.
- Collectors cannot be added to other components, they are a top level commponent.
- Tools are the last component in the chain, they can only be child components.
- All components have a name field, this name should be the device_name of the ESPHome device you intend for the component to represent (e.g. dc-shopvac-1 ) 
- Tool components have a configuration for trigger current, this is the reading that causes the tool sensor to send a message that a tool is running.
- A gate component can operate one or more gates, specify in the components field, which gate should be toggled.
- You can drag any component in the chain to another component that it can be a child of and it will re-parent the component and descendant components.
- Once you have your configuration as it represents your system configured to mimic your actual system, Export the diagram and commit your configuration.
- The configuration file will be written to NodeRed. A flow that runs every 5 minutes will read the file and update the configuration for the system. You can click on left side of the blue node in NodeRed to trigger the flow to run.



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
- Add authentication to services, currently no login needed.
- Document MQTT messages and flows


## Usage Notice

This software is licensed under the [Apache License 2.0](LICENSE).

It is provided free for personal and educational use.  
Use this software at your own risk. The author is **not responsible** for any damage, loss, or injury resulting from its use.  

Commercial use is allowed under the terms of the Apache 2.0 License.

**Author:** BuzzKC  

