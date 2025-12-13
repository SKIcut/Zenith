# Launch Checklist: Zenith (Website + Android)

Use this checklist before launching to ensure both platforms are production-ready.

---

## Pre-Launch (Before You Release)

### Code Quality
- [ ] Run `npm run build` — no errors
- [ ] Run `npm run lint` — no lint warnings (optional)
- [ ] Test locally: `npm run dev` — UI works, no console errors
- [ ] Test Android: build locally, test in emulator for 10+ minutes

### Environment & Security
- [ ] `.env` file contains correct Supabase credentials
- [ ] No hardcoded API keys in code (check `git log -p` for accidents)
- [ ] `.env` file is in `.gitignore` ✓ (never commit secrets)
- [ ] Supabase project is set to production mode

### Feature Testing
- [ ] Chat works (can send messages, receive AI responses)
- [ ] Tasks work (add, complete, delete with confirmation)
- [ ] Memory extraction works (saves goals, challenges)
- [ ] Authentication flows work (sign up, sign in, sign out)
- [ ] Markdown rendering works (**bold**, *italic*, `code`)
- [ ] Responsive design tested on mobile (375px, 1024px widths)

### Content
- [ ] App name: "Zenith" ✓
- [ ] App icon finalized (512×512 PNG)
- [ ] Splash screen configured (Android)
- [ ] Privacy policy written and published (URL ready)
- [ ] Terms of service written (optional but recommended)

---

## Website Deployment (Vercel)

### Setup
- [ ] GitHub repo connected to Vercel
- [ ] Vercel project created: `Zenith`
- [ ] Environment variables added in Vercel Settings:
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_PUBLISHABLE_KEY`
- [ ] Deploy preview tested and working

### Launch
- [ ] Final commit: `git push origin main`
- [ ] Verify Vercel deployment completes (check Dashboard)
- [ ] Visit live URL: `https://zenith.vercel.app`
- [ ] Test all features on live site
- [ ] (Optional) Configure custom domain in Vercel Settings

### Post-Launch
- [ ] Monitor Vercel Dashboard for errors (check daily for 1 week)
- [ ] Test on real mobile browsers: iOS Safari, Chrome, Firefox
- [ ] Check performance metrics (Vercel Analytics)

---

## Android App Deployment (Google Play)

### Prerequisites
- [ ] Google Play Developer Account created ($25 fee paid)
- [ ] Android SDK installed & `ANDROID_HOME` set
- [ ] Keystore created and saved securely: `~/.keystore/zenith-release.keystore`
- [ ] Keystore password saved in password manager

### Build & Sign
- [ ] Run `npm run build` — success ✓
- [ ] Run `npx cap sync android` — success ✓
- [ ] Open in Android Studio: `npx cap open android`
- [ ] Test on emulator/device: no crashes, all features work
- [ ] Build release: `cd android && ./gradlew assembleRelease`
- [ ] Sign APK with keystore (see ANDROID_BUILD.md for commands)
- [ ] Verify signed APK: `~/.gradle/build/outputs/apk/release/zenith-release.apk` exists

### Google Play Store Setup
- [ ] App listing created in Play Console
- [ ] App icon uploaded (512×512 PNG)
- [ ] App name & short description entered
- [ ] Full description written (4000 chars, include features + support email)
- [ ] Screenshots created (min 2: login, chat, tasks) - 9:16 ratio
- [ ] Feature graphic uploaded (1024×500 PNG)
- [ ] Content rating questionnaire completed
- [ ] Privacy policy URL entered (link to your privacy page)
- [ ] Contact email entered (for user support)
- [ ] Target audience selected (13+, mature content: no)

### Launch to Play Store
- [ ] Upload signed APK to Google Play Console
- [ ] Add release notes (v1.0.0 — Initial launch)
- [ ] Review all app details one final time
- [ ] Click "Publish to Production"
- [ ] Wait for Google review (24-48 hours typically)
- [ ] Once approved, app appears in Play Store ✓

### Post-Launch
- [ ] Monitor Play Console for crashes (check daily)
- [ ] Review user ratings & comments (respond to feedback)
- [ ] Test on multiple Android devices (if possible: Android 10, 12, 14)
- [ ] Keep track of version history for future updates

---

## Communication

### Users
- [ ] Announce website launch (social media, email list)
- [ ] Announce Android app launch (social media, Play Store link)
- [ ] Share direct link to website: `https://zenith.vercel.app`
- [ ] Share direct link to Android app: `https://play.google.com/store/apps/details?id=com.example.app`

### Support
- [ ] Set up support email (e.g., support@yoursite.com)
- [ ] Create FAQ page (link in web footer, Play Store listing)
- [ ] Monitor user feedback on Play Store reviews
- [ ] Respond to negative reviews quickly & professionally

---

## After Launch

### Week 1
- [ ] Monitor for critical bugs (crashes, login issues)
- [ ] Fix and deploy any urgent issues
- [ ] Respond to initial user feedback
- [ ] Check Supabase logs for errors

### Month 1
- [ ] Analyze usage metrics (Vercel Analytics, Play Console stats)
- [ ] Gather feature requests from users
- [ ] Plan first update (bug fixes + 1-2 small features)
- [ ] Monitor Supabase usage/costs

### Ongoing
- [ ] Update docs as features change
- [ ] Keep dependencies up to date (`npm audit`, `npm update`)
- [ ] Monitor error logs weekly
- [ ] Release updates monthly (security patches + features)

---

## Emergency Contacts & Links

| Item | URL / Contact |
|------|---------------|
| Vercel Support | vercel.com/support |
| Google Play Support | support.google.com/googleplay |
| Supabase Support | supabase.com/support |
| Status Pages | status.vercel.com, status.supabase.com |
| GitHub Issues | github.com/SKIcut/Zenith/issues |

---

## Final Checklist (Day of Launch)

```
Morning of launch:
- [ ] Verify all code committed: git status (should be clean)
- [ ] Verify no uncommitted secrets: git diff, git diff --cached
- [ ] Verify live website working: visit zenith.vercel.app
- [ ] Verify Android app working: test in emulator
- [ ] Verify Supabase online: visit supabase.com dashboard

Launch time:
- [ ] Push to GitHub (auto-deploys to Vercel)
- [ ] Upload signed APK to Google Play
- [ ] Announce on social media / email list
- [ ] Monitor Vercel & Play Console for 1 hour

Post-launch (next 24 hours):
- [ ] Check for critical errors (Vercel/Play logs)
- [ ] Respond to user feedback
- [ ] Keep monitoring, be ready to hotfix if needed
```

---

**Status:** Ready for launch ✓
