import { NextRequest, NextResponse } from 'next/server';

const BROWSER_HEADERS = {
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'es-AR,es;q=0.9,en;q=0.8',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Cache-Control': 'no-cache',
};

function extractDataFromHTML(html: string, itemId: string) {
  try {
    let price = 0;
    let title = '';
    let thumbnail = '';
    let year = 0;
    let km = 0;
    let brand = '';
    let condition = 'used';
    let currency = 'ARS';
    let sellerName = '';

    // Extract og:title which contains "Title - $ Price"
    const ogTitleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i);
    if (ogTitleMatch) {
      const ogTitle = ogTitleMatch[1];
      
      // Parse title and price from og:title (format: "Title - $ 36.700.000" or "Title - U$S 50.000")
      const titlePriceMatch = ogTitle.match(/^(.+?)\s*-\s*(?:U?\$S?\s*)([\d.]+)$/);
      if (titlePriceMatch) {
        title = titlePriceMatch[1].trim();
        const priceStr = titlePriceMatch[2].replace(/\./g, '');
        price = parseInt(priceStr) || 0;
        
        // Check for USD
        if (ogTitle.includes('U$S') || ogTitle.includes('USD')) {
          currency = 'USD';
        }
      } else {
        title = ogTitle.replace(/\s*-\s*MercadoLibre.*$/i, '').trim();
      }
    }

    // Fallback title from <title> tag
    if (!title) {
      const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
      if (titleMatch) {
        title = titleMatch[1].replace(/\s*-\s*MercadoLibre.*$/i, '').replace(/\s*\|.*$/, '').trim();
      }
    }

    // Extract og:image for thumbnail
    const ogImageMatch = html.match(/<meta property="og:image" content="([^"]+)"/i);
    if (ogImageMatch) {
      thumbnail = ogImageMatch[1];
    }

    // Extract og:description for additional info (km, condition)
    const ogDescMatch = html.match(/<meta property="og:description" content="([^"]+)"/i);
    if (ogDescMatch) {
      const desc = ogDescMatch[1];
      
      // Check for 0 km (new)
      if (desc.includes('0 KM') || desc.includes('0km') || desc.includes('0 Km')) {
        condition = 'new';
      }
      
      // Try to extract km from description
      const kmDescMatch = desc.match(/(\d{1,3}(?:\.\d{3})*)\s*(?:km|Km|KM)/);
      if (kmDescMatch && !desc.includes('0 KM')) {
        km = parseInt(kmDescMatch[1].replace(/\./g, '')) || 0;
      }
    }

    // Extract year from title
    const yearMatch = title.match(/\b(19\d{2}|20[0-2]\d)\b/);
    if (yearMatch) {
      year = parseInt(yearMatch[1]);
    }

    // Extract brand from title
    const brandPatterns = /\b(Honda|Toyota|Ford|Chevrolet|Volkswagen|VW|Fiat|Renault|Peugeot|Citroën|Citroen|Nissan|Hyundai|Kia|Mercedes[- ]?Benz|Mercedes|BMW|Audi|Jeep|RAM|Dodge|Mitsubishi|Mazda|Subaru|Suzuki|Alfa Romeo|Chery|Geely|JAC|BYD|Great Wall|Haval)\b/i;
    const brandMatch = title.match(brandPatterns);
    if (brandMatch) {
      brand = brandMatch[1];
    }

    // Try to get seller from HTML
    const sellerMatch = html.match(/Concesionario\s+([^•<]+)/i) || 
                       html.match(/"nickname":"([^"]+)"/i);
    if (sellerMatch) {
      sellerName = sellerMatch[1].trim();
    }

    const formattedId = itemId.replace(/^MLA/, 'MLA-');
    const permalink = `https://auto.mercadolibre.com.ar/${formattedId}`;

    return {
      id: itemId,
      title: title || `Vehículo ${itemId}`,
      price: price,
      currency_id: currency,
      thumbnail: thumbnail,
      condition: condition,
      permalink: permalink,
      seller: {
        id: 0,
        nickname: sellerName,
      },
      attributes: [
        { id: 'BRAND', name: 'Marca', value_name: brand },
        { id: 'MODEL', name: 'Modelo', value_name: title },
        { id: 'VEHICLE_YEAR', name: 'Año', value_name: year > 0 ? year.toString() : '' },
        { id: 'KILOMETERS', name: 'Kilómetros', value_name: km > 0 ? km.toString() : '' },
      ],
    };
  } catch (error) {
    console.error('Error extracting data from HTML:', error);
    throw error;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: itemId } = await params;

  if (!itemId) {
    return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
  }

  try {
    const formattedId = itemId.replace(/^MLA/, 'MLA-');
    const url = `https://auto.mercadolibre.com.ar/${formattedId}`;
    
    const response = await fetch(url, {
      headers: BROWSER_HEADERS,
      redirect: 'follow',
      cache: 'no-store',
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      }
      return NextResponse.json(
        { error: `Error fetching page: ${response.status}` },
        { status: response.status }
      );
    }

    const html = await response.text();
    
    // Debug: check if we're getting the right HTML
    const hasOgTitle = html.includes('og:title');
    const hasOgImage = html.includes('og:image');
    console.log(`[ML Item ${itemId}] HTML length: ${html.length}, hasOgTitle: ${hasOgTitle}, hasOgImage: ${hasOgImage}`);
    
    const data = extractDataFromHTML(html, itemId);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching item:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos de MercadoLibre' },
      { status: 500 }
    );
  }
}
