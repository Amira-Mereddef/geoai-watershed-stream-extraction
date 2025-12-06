# geoai-watershed-stream-extraction
🌍 GeoAI Watershed Delineation & Stream Extraction

Using Google Earth Engine (MERIT Hydro + HydroSHEDS)

📌 Course: GeoAI Module — 3rd Year Software Engineering
👩‍💻 Author: Amira Mereddef
🛰 Tools: Google Earth Engine, MERIT Hydro, HydroSHEDS
📖 Overview

This project performs automatic watershed delineation, pour point snapping, and stream extraction using remote sensing hydrological datasets on Google Earth Engine (GEE).

It uses:

MERIT Hydro (high-precision hydro DEM)

HydroSHEDS HYBAS (predefined basin boundaries)

Flow accumulation (Upstream Area) for stream detection

Pixel-based calculations for stream density & basin area

This project was developed as part of my GeoAI module, and represents practical experience in hydrological modeling and Earth Engine scripting.

🎯 Objectives

✔ Delineate the watershed around a user-defined pour point
✔ Snap pour point to nearest high-accumulation stream
✔ Extract river network using accumulation threshold
✔ Compute watershed area (km²)
✔ Measure stream area
✔ Compute accumulation statistics inside the basin
