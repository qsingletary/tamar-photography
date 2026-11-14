# Tamar Photography

Portfolio site for Tamar, a New York photographer. Static HTML, no build step.

- `index.html`: the whole site (home with three category doors, category pages, one page per project, About, Contact)
- `data.js`: project titles, categories, descriptions and image sizes
- `kit.js`: routing, helpers and the image viewer
- `img/`: photographs, one folder per project

The contact form is not connected to a mail service yet; it tells the visitor so and sends nothing.

Run locally: `python3 -m http.server 8765`, then open http://localhost:8765

All photographs © Tamar. Not licensed for reuse.
