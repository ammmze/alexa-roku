# Alex Roku

## Device server

### Configuration

The server will read environment variables to configure it. See the following table for available configurations

| Name | Default Value | Description |
| --- | --- | --- |
| SERVER_PORT | 8080 | The port the server should be listening on |
| DEVICE_SCAN_FREQ_SEC | 60 | How often we should scan for new devices |
| USE_BASIC_AUTH | false | Whether or not basic auth is enabled |
| HTPASSWD_FILE | ./users.htpasswd | The httpasswd file containing the basic auth credentials |

### Authentication

The default login credentials are:

* Username: `admin`
* Password: `admin`

Credentials can be changed using the [htpasswd](https://httpd.apache.org/docs/current/programs/htpasswd.html) tool and updating the users.htpasswd file
