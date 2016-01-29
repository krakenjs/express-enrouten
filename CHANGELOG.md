##### v1.3.0 - 20160129
**Features**
- Add support for babel 6 transformed controllers wth default export

##### v1.2.3 - 20160129
**Bugs**
- Fix regression for bad controllers in directory (#79, #81)

##### v1.2.2 - 20160115
**Bugs**
- Fix logic regarding requiring files with duplicate naming

##### v0.2.1 - 20140210
**Bugs**
- Fix order of scanning and router placement to ensure middleware comes before router.
- Fix file scanning to support all registered/supported Node.js file extensions.

**Features**
- n/a

##### v0.2.0 - 20140127
**Bugs**
- n/a

**Features**
- Modification to implementation, potentially causing side-effects (hence the version bump).

##### v0.1.0 - 20131209
**Bugs**
- n/a

**Features**
- Add more sane API: `app.use(enrouten(settings));`
