import { NextRequest, NextResponse } from 'next/server';

const BROWSER_HEADERS = {
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'es-AR,es;q=0.9,en;q=0.8',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Cache-Control': 'no-cache',
};

interface SearchResult {
  id: string;
  title: string;
  price: number;
  currency_id: string;
  thumbnail: string;
  condition: string;
  permalink: string;
  seller: { id: number; nickname: string };
  location?: { city: { name: string }; state: { name: string } };
  attributes?: Array<{ id: string; name: string; value_name: string }>;
}

function extractSearchResults(html: string): SearchResult[] {
  const results: SearchResult[] = [];
  const seenIds = new Set<string>();
  
  try {
    // Extract texts arrays (year, km) in order - format: "texts":["2025","0 Km"]
    const textsRegex = /"texts":\["([^"]+)","([^"]+)"\]/g;
    const textsData: Array<{year: string, km: string}> = [];
    let textsMatch;
    while ((textsMatch = textsRegex.exec(html)) !== null) {
      const yearOrKm1 = textsMatch[1];
      const yearOrKm2 = textsMatch[2];
      // Year is 4 digits, km contains "Km"
      if (/^\d{4}$/.test(yearOrKm1) && yearOrKm2.includes('Km')) {
        textsData.push({
          year: yearOrKm1,
          km: yearOrKm2.replace(/[^\d]/g, '') // Extract just numbers
        });
      }
    }
    
    // Extract each card from the search results
    const cardPattern = /<div[^>]*class="[^"]*poly-card[^"]*"[^>]*>[\s\S]*?<\/li>/gi;
    const cards = html.match(cardPattern) || [];
    
    let textsIndex = 0;
    
    for (const card of cards) {
      // Extract ID from href
      const idMatch = card.match(/MLA-(\d{9,10})/);
      if (!idMatch) continue;
      
      const id = `MLA${idMatch[1]}`;
      if (seenIds.has(id)) continue;
      seenIds.add(id);
      
      // Extract title
      const titleMatch = card.match(/class="poly-component__title"[^>]*>([^<]+)</i);
      const title = titleMatch ? titleMatch[1].trim() : '';
      
      // Extract price and currency
      let price = 0;
      let currency = 'ARS';
      
      // Check for USD first
      if (card.includes('US$') || card.includes('dólares')) {
        currency = 'USD';
        const usdMatch = card.match(/aria-label="(\d+(?:\.\d+)?)\s*dólares"/i) ||
                        card.match(/andes-money-amount__fraction[^>]*>([0-9.]+)</i);
        if (usdMatch) {
          price = parseInt(usdMatch[1].replace(/\./g, '')) || 0;
        }
      } else {
        // ARS price
        const arsMatch = card.match(/aria-label="(\d+(?:\.\d+)?)\s*pesos"/i) ||
                        card.match(/andes-money-amount__fraction[^>]*>([0-9.]+)</i);
        if (arsMatch) {
          price = parseInt(arsMatch[1].replace(/\./g, '')) || 0;
        }
      }
      
      // Extract thumbnail
      const imgMatch = card.match(/src="(https:\/\/http2\.mlstatic\.com[^"]+)"/i);
      const thumbnail = imgMatch ? imgMatch[1] : '';
      
      // Get year and km from pre-extracted texts data (matched by position)
      let year = '';
      let km = '';
      let condition = 'used';
      
      if (textsIndex < textsData.length) {
        year = textsData[textsIndex].year;
        km = textsData[textsIndex].km;
        if (km === '0') {
          condition = 'new';
        }
        textsIndex++;
      }
      
      // Extract location
      const locationMatch = card.match(/poly-component__location[^>]*>([^<]+)</i);
      const locationStr = locationMatch ? locationMatch[1].trim() : '';
      const locationParts = locationStr.split(' - ');
      
      const formattedId = `MLA-${idMatch[1]}`;
      
      results.push({
        id,
        title: title || `Vehículo ${id}`,
        price,
        currency_id: currency,
        thumbnail,
        condition,
        permalink: `https://auto.mercadolibre.com.ar/${formattedId}`,
        seller: { id: 0, nickname: '' },
        location: locationStr ? {
          city: { name: locationParts[0] || locationStr },
          state: { name: locationParts[1] || '' },
        } : undefined,
        attributes: [
          { id: 'VEHICLE_YEAR', name: 'Año', value_name: year },
          { id: 'KILOMETERS', name: 'Kilómetros', value_name: km },
        ],
      });
      
      if (results.length >= 48) break;
    }
  } catch (error) {
    console.error('Error extracting search results:', error);
  }

  return results;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    const searchUrl = `https://autos.mercadolibre.com.ar/${encodeURIComponent(query).replace(/%20/g, '-')}`;
    
    const response = await fetch(searchUrl, {
      headers: BROWSER_HEADERS,
      redirect: 'follow',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Error al buscar: ${response.status}` },
        { status: response.status }
      );
    }

    const html = await response.text();
    const results = extractSearchResults(html);
    
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error searching MercadoLibre:', error);
    return NextResponse.json(
      { error: 'Error al conectar con MercadoLibre' },
      { status: 500 }
    );
  }
}
