import { createClient } from '@supabase/supabase-js';

export async function handler(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  if (event.httpMethod === 'OPTIONS') { return { statusCode: 200, headers }; }
  if (event.httpMethod !== 'POST') { return { statusCode: 405, headers, body: 'Method Not Allowed' }; }

  console.log('🔄 CART-UPDATE-QUANTITY FUNCTION TRIGGERED');
  
  try {
    const { cart_item_id, new_quantity } = JSON.parse(event.body);
    const authHeader = event.headers.authorization;
    const jwt = authHeader?.split(' ')[1];

    if (!jwt) throw new Error('Authentication token is required.');
    if (!cart_item_id) throw new Error('A cart_item_id is required.');
    if (typeof new_quantity !== 'number') throw new Error('A numeric new_quantity is required.');

    const userSupabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: `Bearer ${jwt}` } } }
    );

    const { data: { user } } = await userSupabase.auth.getUser();
    if (!user) throw new Error('User not found or token invalid.');

    // If the new quantity is 0 or less, we delete the item instead of updating.
    if (new_quantity <= 0) {
      console.log(`Quantity is 0. Deleting cart item ${cart_item_id} for user ${user.id}`);
      const { error } = await userSupabase.from('cart_items').delete().eq('id', cart_item_id);
      if (error) throw error;
      return { statusCode: 200, headers, body: JSON.stringify({ status: 'deleted', id: cart_item_id }) };
    } else {
      // Otherwise, we update the quantity.
      console.log(`Updating quantity to ${new_quantity} for cart item ${cart_item_id}`);
      const { data, error } = await userSupabase
        .from('cart_items')
        .update({ quantity: new_quantity })
        .eq('id', cart_item_id)
        .select()
        .single();
      if (error) throw error;
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

  } catch (err) {
    console.error('❌ Top-level cart-update-quantity error:', err);
    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ error: err.message || 'An unknown server error occurred.' }) 
    };
  }
} 