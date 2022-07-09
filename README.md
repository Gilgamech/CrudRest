# Programmatic Webserver
*An API with an API*
- Specify Actions that are performed on each GET.
- Specify permissions foreach URI resource, and use the Everyone keyword for anonymous access.
- Load request data from memory, from filesystem, or from URI - then transform and serve!
- Use __Path Variables__ to call another internal path. These use percents instead of path slashes, such as %increment below. This helps prevent confusion with Divide functionality explained further down.

- Each path can respond differently. Serve paths with static content locally, forward paths with dynamic content across an array of other hosts, and host a cached copy of remote data on another path.
- A Putfile is uploaded in the Body of a PUT request. Example Putfile:
        {
          "URI": "/increment",
          "Action": "data~%increment+1",
          "Owner": "BobbyTables",
          "AccessList": {
            "Everyone": [
              "GET",
              "HEAD",
              "OPTIONS",
              "POST",
              "PUT",
              "DELETE",
              "MERGE"
            ]
          },
          "notes": "",
          "Data": ""
        }


### Verb Uses
- GET - Performs specified Action.
- HEAD - Normal functionality
- OPTIONS - Normal functionality
- POST - Performs "login" action if set. Otherwise populates Data parameter of the path. This is often served by a GET request, either directly or after transformation. 
- PUT - Upload a Putfile, like the one just above. The Data parameter can be filled in, giving another way to populate this parameter alongside a POST request.
- DELETE - Deletes the path's Putfile. 
- MERGE - Read only display of Putfile. (I ran out of verbs.)

## Filesystem source

- Filesystem source is the default Action for paths. 
- Format: fs\~/file.ext

#### Example: Serve index.html as root.

- Method: Put
- Location: http://localhost/
- Body: 
	1. URI:  / 
	2. Action:  fs\~/index.html
	3. Owner:  BobbyTables
	4. AccessList: Everyone: \[GET HEAD OPTIONS POST PUT DELETE MERGE\]
	5. notes: 
	6. Data: 

##### About the Body:
- Must be in JSON format. (Sorry YAML fans.)
- Size limit coming shortly. Please keep these sensible and short until then. 
1. URI in field must match the upload path, as a validation check. It's local to the host for now, but this might change in the future to provide multi-domain support. Here, the root URI / is used. 
2. Action is populated with Action fs\~/sub/pathname.ext if the page hasn't been visited before. 
	- File is read from filesystem into the Data field of the Body, then read from the Data field into the response. 
	- But if the page exists and the Action has been changed to blank, will just try to respond with the Data field and won't check the filesystem.
3. Owner can always perform GET and PUT in any situation, so the can always control that path. More functionality is planned around this field. 
4. AccessList controls which verbs will respond to which users.
    - The Everyone keyword is used to control access for all users, including not logged in. 
    - So if you specify that Everyone can GET, and you can only POST, then you'll be able to both GET and POST.
5. Notes may contain user-specified data, but some functions (currently only load balancer) use them to store data too, so don't remove what you didn't add. 

## URI source

#### Load-balance between 2 websites

- Method: Put
- Location: http://localhost/BobbyTables.html
    1. URI: /BobbyTables.html
    2. Action:  uri\~GET\~https://www.Gilgamech.com , https://Gilgamech.Neocities.org\ ~0
    3. Owner: BobbyTables
    4. AccessList: Everyone: \[GET HEAD OPTIONS POST PUT DELETE MERGE\]
    5. notes:
    6. Data: 

The Action can hold numerous URLs. For traditional load balancing, these would be internal locations, such as https://server1/ and https://server2/. External URLs with very different pages are being used here for demonstration only.

## In-memory source

#### Increment on GET

- Method: Put
- Location: http://localhost/increment
	1. URI: /increment
	2. Action: data\~%increment+1
	3. Owner: BobbyTables
	4. AccessList: Everyone: \[GET HEAD OPTIONS POST PUT DELETE MERGE\]
	5. notes:
	6. Data: 1

Here, the action takes the value stored in the Data property of the /increment path, adds one to it, and stores the value in the current path's Data property, then responds with it as the body. This makes a very good counter. And it can also call different paths, add two paths, and add two static numbers. It only takes one function per Action currently - nesting Actions are coming soon.


#### Decrement on GET

- Method: Put
- Location: http://localhost/decrement
- Body: 
	1. URI: /decrement
	2. Action: data\~%decrement-1
	3. Owner: BobbyTables
	4. AccessList: Everyone: \[GET HEAD OPTIONS POST PUT DELETE MERGE\]
	5. notes:
	6. Data: 1000000

This path's Action specifies to take the /decrement path's Data property and subtract one. As before, this works with other paths and also with static numbers.

#### Multiply on GET

- Method: Put
- Location: http://localhost/multiply
- Body: 
	1. URI: /multiply
	2. Action: data\~%multiply*2
	3. Owner: BobbyTables
	4. AccessList: Everyone: \[GET HEAD OPTIONS POST PUT DELETE MERGE\]
	5. notes:
	6. Data: 1

This path's actions multiply. Same situations and caveats as previous.

#### Divide on GET

- Method: Put
- Location: http://localhost/divide
- Body: 
	1. URI: /divide
	2. Action: data\~%divide/2
	3. Owner: BobbyTables
	4. AccessList: Everyone: \[GET HEAD OPTIONS POST PUT DELETE MERGE\]
	5. notes:
	6. Data: 1000000

This path divides. Same situations and caveats as previous.

#### Data concatenation

- Method: Put
- Location: http://localhost/RobbieRotten.html
	1. URI: /page.html
	2. Action: data\~%header.html &lt;div class="textBubbleBG"&gt;&lt;h1&gt;We Are Number 1!&lt;/h1&gt;&lt;/div&gt;  %footer.html
	3. Owner: BobbyTables
	4. AccessList: Everyone: \[GET HEAD OPTIONS POST PUT DELETE MERGE\]
	5. notes:
	6. Data: 

This Action shows the real power of Path Variables, by creating a webpage with one line of code. First it replaces the %header variable with your webpage's header and menu section. Then it adds the short message, referencing a CSS class in a file loaded by the header. Finally, the website footer is loaded from its path variable, before storing the page in RobbieRotten.html's Data property, and responding with it. This could be combined with transforming the data with an above function before serving. Future updates will increase the functionality and robustness of this dynamic page generation method. 


## Validation Testing

#### URI mismatch test

- Method: Put
- Location: http://localhost/test
	1. URI: /decrement
	2. Action: data\~%decrement-1
	3. Owner: BobbyTables
	4. AccessList: Everyone: \[GET HEAD OPTIONS POST PUT DELETE MERGE\]
	5. notes:
	6. Data: 1000000

This test should fail, since the URI specifies the /decrement path, but the location is for the /test path.

#### User-specific permissions

- Method: Put
- Location: http://localhost/test2
	1. URI: /test2
	2. Action: data\~%test2/2
	3. Owner: BobbyTables
	4. AccessList: BobbyTables: \[GET HEAD OPTIONS POST PUT DELETE MERGE\]
	5. notes:
	6. Data: 1000000

This test lets you test the permissions system by trying verbs as Everyone, which should all fail. We'll use this again after logging in.

## Login Functionality

#### Login Page Setup

- Method: Put
- Location: http://localhost/login
	1. URI: /login
	2. Action: login
	3. Owner: BobbyTables
	4. AccessList: Everyone: \[GET HEAD OPTIONS POST PUT DELETE MERGE\]
	5. notes:
	6. Data: 

The login Action here tells the path to capture POST requests on this path for the Login codepath instead of populating the Data parameter. 

#### Login Request

- Method: Post
- Location: http://localhost/login
	- username: BobbyTables
	- password: HorseBatteryStapleCorrect
	- emailAddress: (optional)


#### Login Response

- Method: Response
- Location: http://localhost/login
- Body: Bearer 5ff23b8c1562689dbaa11b0891e0a29c

Response body will include the Bearer token, which is the word "Bearer" and a space followed by a random string from a cryptographic module. All subsequent requests must include this token in a header named "token" to receive a logged-in response.

#### Login Test

- Method: Get
- Location: http://localhost/test2
- Headers
    - token: Bearer 5ff23b8c1562689dbaa11b0891e0a29c

Reusing an above test - this time we're logged in as the user with access (BobbyTables) so we should get a 200 OK response, with 500k in the body (since it performed a division operation on its data).