import fetch from "node-fetch";

async function getLatLngForPostCode(postCode: string) {
  const token = process.env.MAPBOX_ACCESS_TOKEN?.trim();
  if (!token) {
    console.error("MAPBOX_ACCESS_TOKEN is not set.");
    return undefined;
  }

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(postCode)}.json?country=GB&types=postcode&limit=1&access_token=${token}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: any = await response.json();

    if (data && data.features && data.features.length > 0) {
      const [longitude, latitude] = data.features[0].center;

      return { longitude, latitude };
    } else {
      console.log("No results found for this postcode.");
    }
  } catch (error: any) {
    console.error("Error fetching data:", error.message);
  }
}

export { getLatLngForPostCode };
