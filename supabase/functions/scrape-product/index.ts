import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      throw new Error('URL is required');
    }

    console.log('Scraping product from URL:', url);

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    let productName = '';
    let productPrice = '';
    let productImage = '';

    // Try common selectors for different e-commerce platforms
    // BigBasket
    if (url.includes('bigbasket.com')) {
      productName = $('h1[itemprop="name"]').text().trim() || 
                    $('.Description___StyledH-sc-82a36a-2').text().trim();
      productPrice = $('span[itemprop="price"]').text().trim() ||
                     $('.Pricing___StyledLabel-sc-pldi2d-1').text().trim();
      productImage = $('img[itemprop="image"]').attr('src') || 
                     $('.ProductImage___StyledImg-sc-1bnvmgo-1').attr('src') || '';
    }
    // Amazon
    else if (url.includes('amazon')) {
      productName = $('#productTitle').text().trim();
      productPrice = $('.a-price-whole').first().text().trim();
      productImage = $('#landingImage').attr('src') || 
                     $('.a-dynamic-image').first().attr('src') || '';
    }
    // Blinkit
    else if (url.includes('blinkit.com') || url.includes('grofers.com')) {
      productName = $('h1').first().text().trim();
      productPrice = $('[class*="Product__Price"]').text().trim();
      productImage = $('img[alt*="product"]').first().attr('src') || '';
    }
    // Flipkart
    else if (url.includes('flipkart.com')) {
      productName = $('span.VU-ZEz').first().text().trim();
      productPrice = $('.Nx9bqj').first().text().trim();
      productImage = $('.DByuf4').first().attr('src') || '';
    }
    // Generic fallback selectors
    else {
      productName = $('h1').first().text().trim() ||
                    $('[itemprop="name"]').first().text().trim() ||
                    $('meta[property="og:title"]').attr('content') || '';
      
      productPrice = $('[itemprop="price"]').first().text().trim() ||
                     $('[class*="price"]').first().text().trim() ||
                     $('meta[property="og:price:amount"]').attr('content') || '';
      
      productImage = $('[itemprop="image"]').first().attr('src') ||
                     $('meta[property="og:image"]').attr('content') || '';
    }

    // Clean up price - extract numbers
    const priceMatch = productPrice.match(/[\d,]+\.?\d*/);
    const cleanPrice = priceMatch ? priceMatch[0].replace(/,/g, '') : '';

    console.log('Scraped data:', { productName, price: cleanPrice, productImage });

    if (!productName && !cleanPrice) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Could not extract product details. Please enter manually.',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          name: productName || 'Unknown Product',
          price: cleanPrice || '0',
          image: productImage || null,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in scrape-product function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to scrape product';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});