import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:provider/provider.dart';
import 'package:tourguide_mobile/core/api_client.dart';
import 'package:tourguide_mobile/core/locale_controller.dart';
import 'package:tourguide_mobile/core/session.dart';
import 'package:tourguide_mobile/core/token_store.dart';
import 'package:tourguide_mobile/models/models.dart';
import 'package:tourguide_mobile/screens/auth/login_screen.dart';
import 'package:tourguide_mobile/screens/auth/register_screen.dart';
import 'package:tourguide_mobile/screens/shared/account_screen.dart';
import 'package:tourguide_mobile/services/repository.dart';

import 'helpers.dart';

const ar = Locale('ar');

void main() {
  testWidgets('login screen renders in Arabic, right-to-left', (tester) async {
    await tester.pumpWidget(localizedApp(const LoginScreen(), locale: ar));
    await tester.pumpAndSettle();

    expect(find.text('تسجيل الدخول'), findsWidgets);
    expect(find.text('البريد الإلكتروني'), findsWidgets);
    expect(find.text('مستخدم جديد؟ أنشئ حسابك الآن'), findsOneWidget);
    expect(Directionality.of(tester.element(find.byType(TextField).first)), TextDirection.rtl);
    // Email input stays left-to-right inside the RTL layout.
    expect(tester.widget<TextField>(find.byType(TextField).first).textDirection, TextDirection.ltr);
  });

  testWidgets('register validators speak Arabic', (tester) async {
    await tester.pumpWidget(localizedApp(const RegisterScreen(), locale: ar));
    await tester.pumpAndSettle();

    expect(find.text('إنشاء حساب'), findsWidgets);
    await tester.tap(find.widgetWithText(FilledButton, 'إنشاء حساب'));
    await tester.pumpAndSettle();

    expect(find.text('أدخل اسمك'), findsOneWidget);
    expect(find.text('أدخل بريداً إلكترونياً صحيحاً'), findsOneWidget);
    expect(find.textContaining('استخدم الصيغة الدولية'), findsOneWidget);
    expect(find.text('يجب ألا تقل عن 8 أحرف'), findsOneWidget);
  });

  testWidgets('account screen for a signed-in guide in Arabic', (tester) async {
    final api = ApiClient(baseUrl: 'http://api.test', httpClient: MockClient((_) async => http.Response('{}', 200)));
    final repo = Repository(api);
    final session = Session(api, repo, store: MemoryTokenStore());
    await session.signIn(AuthResult(
      accessToken: 'a',
      refreshToken: 'r',
      user: AppUser(id: 'u1', fullName: 'Faisal Al-Harbi', role: UserRole.guide, phone: '+966500000000'),
    ));

    await tester.pumpWidget(MultiProvider(
      providers: [
        Provider.value(value: repo),
        ChangeNotifierProvider.value(value: session),
        ChangeNotifierProvider(create: (_) => LocaleController(api, store: MemoryLocaleStore())),
      ],
      child: localizedApp(const AccountScreen(), locale: ar),
    ));
    await tester.pumpAndSettle();

    expect(find.text('الحساب'), findsOneWidget);
    expect(find.text('وضع المرشد'), findsOneWidget);
    expect(find.text('غير موثّق — التوثيق مطلوب للحجز'), findsOneWidget);
    expect(find.text('\u2066+966500000000\u2069'), findsOneWidget);
    expect(find.text('تسجيل الخروج'), findsOneWidget);
    expect(Directionality.of(tester.element(find.text('وضع المرشد'))), TextDirection.rtl);
  });
}
