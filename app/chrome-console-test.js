// Chrome Console Test for luxposv1.vercel.app Supabase Connection
// Copy and paste this entire script into Chrome DevTools console on luxposv1.vercel.app

console.log('🔍 Testing luxposv1.vercel.app Supabase Connection\n');

// Test 1: Check if Supabase client exists
if (typeof window.supabase !== 'undefined') {
    console.log('✅ Global supabase client found');
} else {
    console.log('⚠️ Global supabase client not found, checking window object...');
    
    // Look for supabase in window object
    let found = false;
    for (let key in window) {
        if (key.toLowerCase().includes('supabase')) {
            console.log(`🔍 Found potential supabase object: ${key}`);
            found = true;
        }
    }
    if (!found) {
        console.log('❌ No Supabase client found in window object');
    }
}

// Test 2: Try to access supabase from React app (if available)
(async function testSupabaseConnection() {
    try {
        // Try to get supabase from the app's modules
        const appElement = document.querySelector('#root');
        if (appElement) {
            console.log('✅ React app root found');
        }
        
        // Test basic Supabase connection by trying to query
        console.log('\n🔄 Testing database connection...');
        
        // Try different ways to access supabase
        let supabaseClient = null;
        
        // Method 1: Check if it's globally available
        if (typeof window.supabase !== 'undefined') {
            supabaseClient = window.supabase;
        }
        
        // Method 2: Try to create from env vars (if accessible)
        if (!supabaseClient && typeof window !== 'undefined') {
            try {
                // Check if we can access the app's supabase instance
                const reactApp = appElement?._reactRootContainer?._internalRoot?.current?.child;
                if (reactApp && reactApp.memoizedProps && reactApp.memoizedProps.value) {
                    const store = reactApp.memoizedProps.value;
                    // Look for supabase in the store context
                    console.log('🔍 Checking React store for supabase...');
                }
            } catch (e) {
                console.log('⚠️ Could not access React internals');
            }
        }
        
        // Method 3: Create test client using common pattern
        if (!supabaseClient) {
            console.log('🔧 Creating test Supabase client...');
            // Try to get URL from page or use common pattern
            const scripts = document.querySelectorAll('script');
            let supabaseUrl = null;
            let supabaseKey = null;
            
            scripts.forEach(script => {
                const content = script.textContent || script.innerHTML;
                if (content && content.includes('supabase')) {
                    const urlMatch = content.match(/https:\/\/[^"'\s]+\.supabase\.co[^"'\s]*/);
                    const keyMatch = content.match(/eyJ[^"'\s]*/);
                    
                    if (urlMatch) supabaseUrl = urlMatch[0];
                    if (keyMatch && keyMatch[0].length > 50) supabaseKey = keyMatch[0];
                }
            });
            
            if (supabaseUrl && supabaseKey) {
                console.log('🔑 Found Supabase credentials in page');
                // Create test client
                const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
                supabaseClient = createClient(supabaseUrl, supabaseKey);
            }
        }
        
        if (!supabaseClient) {
            console.log('❌ Could not create Supabase client');
            console.log('💡 Manual test: Try accessing window.supabase directly in console');
            return;
        }
        
        // Test database connection
        const { data, error } = await supabaseClient.from('tenants').select('id, name').limit(1);
        
        if (error) {
            console.error('❌ Database connection failed:', error.message);
            console.log('🔍 Error details:', error);
        } else {
            console.log('✅ Database connection successful!');
            console.log('📊 Sample data:', data);
        }
        
        // Test authentication
        console.log('\n🔐 Testing authentication...');
        const { data: authData, error: authError } = await supabaseClient.auth.getSession();
        
        if (authError) {
            console.error('❌ Auth error:', authError.message);
        } else {
            console.log('✅ Auth service working');
            console.log('👤 Current session:', authData.session ? 'Active' : 'None');
            if (authData.session) {
                console.log('📧 User email:', authData.session.user?.email);
            }
        }
        
        // Test real-time connection
        console.log('\n📡 Testing real-time capabilities...');
        const testChannel = supabaseClient.channel('connection-test');
        
        testChannel
            .on('broadcast', { event: 'test' }, (payload) => {
                console.log('✅ Real-time message received:', payload);
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Real-time subscription successful');
                    
                    // Send test message
                    testChannel.send({
                        type: 'broadcast',
                        event: 'test',
                        payload: { message: 'Connection test successful!', timestamp: Date.now() }
                    });
                    
                    // Clean up
                    setTimeout(() => {
                        supabaseClient.removeChannel(testChannel);
                        console.log('🧹 Test completed successfully');
                    }, 2000);
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('❌ Real-time subscription failed');
                }
            });
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('💡 Try running: window.supabase.from("tenants").select("id").limit(1)');
    }
})();

// Test 3: Check network requests
console.log('\n🌐 Checking network activity...');
const originalFetch = window.fetch;
window.fetch = function(...args) {
    if (args[0] && args[0].includes && args[0].includes('supabase')) {
        console.log('📡 Supabase request:', args[0]);
    }
    return originalFetch.apply(this, args);
};

console.log('✅ Network monitoring enabled - Supabase requests will be logged');
console.log('\n💡 Manual tests you can run:');
console.log('- window.supabase?.from("tenants").select("id").limit(1)');
console.log('- window.supabase?.auth.getSession()');
console.log('- Check Network tab for "supabase" requests');
