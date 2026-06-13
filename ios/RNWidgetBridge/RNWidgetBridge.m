#import "RNWidgetBridge.h"

@implementation RNWidgetBridge

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(savePrayerData:(NSDictionary *)data
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  NSUserDefaults *defaults = [[NSUserDefaults alloc] initWithSuiteName:@"group.com.app1.sunnah"];
  NSError *error = nil;
  NSData *jsonData = [NSJSONSerialization dataWithJSONObject:data options:0 error:&error];
  if (error) {
    reject(@"SAVE_ERROR", error.localizedDescription, error);
    return;
  }
  [defaults setObject:jsonData forKey:@"sunnah_widget_prayer_data"];
  [defaults synchronize];
  resolve(nil);
}

@end
