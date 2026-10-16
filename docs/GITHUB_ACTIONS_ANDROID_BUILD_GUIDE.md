# بناء APK لـ NOVA عبر GitHub Actions من الهاتف فقط

هذا المسار لا يحتاج Android Studio أو كمبيوتر محلي. GitHub Actions سيجهز Node وJava وAndroid SDK وNDK وCMake، ثم ينشئ مشروع Android من Expo ويبني APK ويرفعه كـ artifact.

## ما تم تجهيزه في المشروع

الملف التالي موجود في المستودع:

```text
.github/workflows/android-apk.yml
```

الـ workflow يقوم تلقائيًا بـ:

1. تنزيل المشروع.
2. تثبيت pnpm وNode.js 22 وJava 21.
3. تثبيت Android Platform 36 وBuild Tools 36.0.0 وNDK 27.1.12297006 وCMake.
4. تثبيت dependencies من `pnpm-lock.yaml`.
5. تشغيل TypeScript checks والاختبارات وserver build.
6. تشغيل Expo prebuild لإنشاء مجلد Android داخل runner.
7. التحقق من اكتشاف `nova-native` و`NovaNativeModule`.
8. بناء `app-debug.apk`.
9. إنشاء SHA-256 checksum.
10. رفع APK وchecksum للتنزيل.

## 1. إنشاء حساب GitHub من الهاتف

1. افتح تطبيق GitHub أو `github.com`.
2. أنشئ حسابًا أو سجّل الدخول.
3. أنشئ مستودعًا جديدًا، مثل:

```text
nova-android-agent
```

4. اجعل المستودع **Private** إذا كان المشروع يحتوي على كود خاص أو إعدادات غير مخصصة للنشر العام.
5. لا تنشئ ملفات إضافية مثل README أو `.gitignore` من GitHub إذا كان المستودع سيستقبل المشروع كاملًا.

## 2. رفع المشروع من الهاتف

يوجد مساران. استخدم المسار الأول إذا ظهر لك خيار رفع مجلد، لأنه الأسهل.

### المسار A: رفع الملفات من GitHub Web

1. افتح المستودع من الهاتف.
2. اختر **Add file → Upload files**.
3. ارفع محتويات مشروع NOVA كاملة.
4. تأكد من رفع المجلدات المهمة:
   - `app/`
   - `components/`
   - `modules/nova-native/`
   - `server/`
   - `shared/`
   - `tests/`
   - `package.json`
   - `pnpm-lock.yaml`
   - `app.config.ts`
   - `.github/workflows/android-apk.yml`
5. اضغط **Commit changes** إلى فرع `main`.

إذا لم يسمح GitHub Web برفع مجلدات كثيرة من الهاتف، استخدم المسار B أو تطبيق GitHub-compatible يدعم رفع مجلد المشروع.

### المسار B: رفع ملف ZIP من الهاتف

GitHub لا يفك ZIP تلقائيًا داخل المستودع. إذا كان لديك تطبيق Git client على الهاتف، استخدمه لرفع الملفات وفكها قبل commit. لا ترفع ZIP وحده وتتوقع أن يعمل workflow، لأن GitHub Actions يحتاج `package.json` و`.github/workflows/android-apk.yml` في جذر المستودع.

## 3. تشغيل البناء

بعد commit إلى `main`، سيبدأ workflow تلقائيًا.

لتشغيله يدويًا:

1. افتح تبويب **Actions**.
2. اختر **Build NOVA Android APK**.
3. اضغط **Run workflow**.
4. اختر branch `main`.
5. اضغط **Run workflow**.

يمكنك متابعة الخطوات من الهاتف. البناء قد يستغرق عدة دقائق لأن GitHub يثبت Android SDK وNDK وCMake في runner جديد.

## 4. تنزيل APK

بعد ظهور الحالة الخضراء:

1. افتح تشغيل workflow الناجح.
2. مرّر إلى قسم **Artifacts**.
3. نزّل:

```text
nova-debug-apk-<commit-sha>
```

4. افتح الملف المضغوط على الهاتف.
5. استخرج `app-debug.apk`.
6. احتفظ بملف `app-debug.apk.sha256` للتحقق من سلامة الملف.

## 5. تثبيت APK على هاتف Android

1. انقل `app-debug.apk` إلى الهاتف إذا كان التنزيل تم من متصفح أو جهاز آخر.
2. افتح الملف.
3. اسمح للمتصفح أو مدير الملفات بالتثبيت من مصادر غير معروفة عند طلب Android.
4. ثبّت التطبيق.
5. افتح NOVA.

هذا APK هو **debug/development build**. لا تعتبره إصدار متجر أو إصدار Production.

## 6. أول اختبار بعد التثبيت

نفّذ بالترتيب:

1. افتح NOVA.
2. اختبر `getStatus()` و`getCapabilities()` من شاشة native status إذا كانت متاحة.
3. افتح Android Accessibility Settings.
4. فعّل NOVA يدويًا.
5. ارجع إلى NOVA وتحقق من تغير الحالة.
6. استخدم تطبيقًا واحدًا مدعومًا فقط.
7. نفذ workflow بسيطًا يحتاج موافقة المستخدم.
8. تحقق من أن النتيجة لا تصبح `COMPLETED` بدون evidence.
9. اختبر cancel قبل أي إجراء حساس.

## 7. إذا فشل البناء

افتح تشغيل workflow الفاشل من تبويب Actions.

- إذا فشل `pnpm check` أو `pnpm test`: المشكلة في JavaScript أو dependencies.
- إذا فشل `expo prebuild`: المشكلة في Expo config أو local module registration.
- إذا فشل `Verify NOVA native module discovery`: تحقق من أن `modules/nova-native/` و`expo-module.config.json` رُفعا كاملين.
- إذا فشل Gradle أو Kotlin: نزّل artifact باسم `nova-android-build-diagnostics-...` من نفس التشغيل.

لا تضع أي API keys داخل GitHub repository أو workflow file.

## 8. ما الذي لا يفعله هذا workflow

- لا ينشئ Emulator للاختبار التفاعلي.
- لا يثبت APK على هاتفك تلقائيًا.
- لا يمنح Accessibility permission تلقائيًا.
- لا ينفذ Android actions تلقائيًا.
- لا يبني MediaProjection runtime.
- لا يحول debug APK إلى production release.

يتم بناء APK فقط. التثبيت وتفعيل Accessibility واختبار الوكيل يتم يدويًا على هاتفك.

## 9. المتطلبات الأمنية

- لا ترفع `.env` أو مفاتيح API.
- لا تضع keystore داخل المستودع.
- لا تجعل المستودع عامًا قبل مراجعة الكود.
- استخدم GitHub Secrets لاحقًا فقط عند إضافة provider أو release signing.
- احذف APK debug من GitHub artifacts بعد انتهاء فترة الاختبار إذا كان المشروع خاصًا.

## 10. النتيجة المتوقعة

عند نجاح workflow، يجب أن تحصل على:

```text
app-debug.apk
app-debug.apk.sha256
```

ويكون مسار البناء قد تحقق إذا نجحت:

```text
JavaScript validation
→ Expo prebuild
→ nova-native autolinking
→ Kotlin/Gradle compilation
→ APK packaging
→ artifact upload
```
