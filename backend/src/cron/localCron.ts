import cron from 'node-cron';
import { autoCancelTimeoutClaims } from '../utils/autoCancelTimeout';

export function startLocalCron() {
  cron.schedule('0 * * * *', async () => {
    console.log(`[${new Date().toISOString()}] Running auto-cancel timeout check...`);
    
    try {
      const result = await autoCancelTimeoutClaims();
      if (result.cancelledCount > 0) {
        console.log(`✅ Auto-cancelled ${result.cancelledCount} timeout claims`);
        result.details.forEach(d => {
          console.log(`   - ${d.foodTitle} (${d.claimId})`);
        });
      } else {
        console.log(`ℹ️ No timeout claims found`);
      }
    } catch (error) {
      console.error('❌ Auto-cancel failed:', error);
    }
  });
  
  console.log('🕐 Local cron started: auto-cancel check every hour');
}