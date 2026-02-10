const apiUrl =
  "https://opbento.vercel.app/api/bento?n=Jinef&i=https%3A%2F%2Fnews.mit.edu%2Fsites%2Fdefault%2Ffiles%2Fstyles%2Fnews_article__image_gallery%2Fpublic%2Fimages%2F202012%2FMIT-Coding-Brain-01-press_0.jpg%3Fitok%3DJKoUflf8&g=jinef-john&x=jinefjohn&l=&p=https%3A%2F%2Fjinef.netlify.app%2F&z=7708f";
interface BentoResponse {
  url: string;
}

const fetchBentoUrl = async (apiUrl: string): Promise<string> => {
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: BentoResponse = (await response.json()) as BentoResponse;
    console.log("Fetched Bento URL:", data.url);
    return data.url;
  } catch (error) {
    console.error("Error fetching Bento URL:", error);
    throw error;
  }
};

// @ts-ignore
fetchBentoUrl(apiUrl);
