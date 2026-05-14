# minimatch

最小限のパターンマッチングユーティリティ。

npmの内部で使用されているマッチングライブラリです。

glob式をJavaScriptの`RegExp`オブジェクトに変換することで動作します。

## Usage

```js
import minimatch from "https://code4fukui.github.io/minimatch/minimatch.js";

minimatch('bar.foo', '*.foo') // true!
minimatch('bar.foo', '*.bar') // false!
minimatch('bar.foo', '*.+(bar|foo)', { debug: true }) // true、かつ詳細な出力！
```

## Features

次のglob機能をサポートしています:

- ブレース展開 (Brace Expansion)
- 拡張globマッチング
- "Globstar" `**` マッチング

参照:

- `man sh`
- `man bash`
- `man 3 fnmatch`
- `man 5 gitignore`

## Windows

**glob式では必ずフォワードスラッシュ（`/`）のみを使用してください。**

Windowsでは`/`または`\`のどちらもパスセパレータとして使用されますが、このglob実装では`/`のみを使用します。glob式では**必ずフォワードスラッシュのみ**を使用してください。パターン内のバックスラッシュはパスセパレータではなく、常にエスケープ文字として解釈されます。

ただし、Windowsのパスにおいて`\`または`/`はパスセパレータとして解釈され、glob式の`/`とマッチします。

したがって、パターンでは常に`/`を使用してください。

### UNC Paths

Windowsでは`//?/c:/...`や`//ComputerName/Share/...`のようなUNCパスは特別に処理されます。

- ダブルスラッシュで始まり、その後にスラッシュ以外の文字が続くパターンは、ダブルスラッシュを保持します。結果として、`//*`というパターンは`//x`にマッチしますが、`/x`にはマッチしません。
- `//?/<ドライブレター>:`で始まるパターンでは、`?`をワイルドカード文字として扱いません。代わりに、通常の文字列として扱われます。
- `//?/<ドライブレター>:/...`で始まるパターンは、`//?/`が存在しないかのように、`<ドライブレター>:/...`で始まるファイルパスにマッチし、その逆も同様です。この動作は、ドライブレターが大文字小文字を区別せずに一致する場合にのみ適用されます。パスやパターンの残りの部分は、`nocase:true`が設定されていない限り、大文字小文字を区別して比較されます。

ファイルパス引数において`\`文字をパスセパレータとして使用してUNCパスを指定することは常に許可されますが、パターン引数においてはオプションで`windowsPathsNoEscape: true`が設定されている場合にのみ許可されることに注意してください。

## Minimatch Class

`minimatch.Minimatch`クラスをインスタンス化してminimatchオブジェクトを作成します。

```javascript
import minimatch from "https://code4fukui.github.io/minimatch/minimatch.js";
const Minimatch = minimatch.Minimatch;
const mm = new Minimatch(pattern, options);
```

### Properties

- `pattern` minimatchオブジェクトが表す元のパターン。
- `options` コンストラクタに渡されたオプション。
- `set` 正規表現または文字列式の2次元配列。各行はブレース展開されたパターンに対応します。行内の各要素は単一のパス部分に対応します。たとえば、パターン`{a,b/c}/d`は次のように展開されます:

        [ [ a, d ]
        , [ b, c, d ] ]

  パターンの一部に「マジック」（つまり、`fo*o?`ではなく`"foo"`のようなもの）が含まれていない場合、正規表現に変換されず文字列のままになります。

- `regexp` `makeRe`メソッドによって作成されます。パターン全体を表現する単一の正規表現です。これは、`FNM_PATH`を有効にした`fnmatch(3)`のようにパターンを使用したい場合に便利です。
- `negate` パターンが否定されている場合に`true`。
- `comment` パターンがコメントの場合に`true`。
- `empty` パターンが`""`の場合に`true`。

### Methods

- `makeRe` 必要に応じて`regexp`メンバーを生成し、返します。パターンが無効な場合は`false`を返します。
- `match(fname)` ファイル名がパターンにマッチする場合に`true`を返し、それ以外の場合は`false`を返します。
- `matchOne(fileArray, patternArray, partial)` `/`で分割されたファイル名を取り、`regExpSet`の単一行に対してマッチさせます。このメソッドは主に内部用ですが、過剰なファイルシステム呼び出しを避ける必要があるglob-walkerで使用できるように公開されています。

他のすべてのメソッドは内部用であり、必要に応じて呼び出されます。

### minimatch(path, pattern, options)

メインのエクスポートです。オプションを使用してパスをパターンに対してテストします。

```javascript
var isJS = minimatch(file, '*.js', { matchBase: true })
```

### minimatch.filter(pattern, options)

与えられた引数をテストする関数を返します。`Array.filter`での使用に適しています。例:

```javascript
var javascripts = fileList.filter(minimatch.filter('*.js', { matchBase: true }))
```

### minimatch.match(list, pattern, options)

`fnmatch`や`glob`のスタイルで、ファイルのリストに対してマッチングを行います。何もマッチせず、`options.nonull`が設定されている場合は、パターン自体を含むリストを返します。

```javascript
var javascripts = minimatch.match(fileList, '*.js', { matchBase: true })
```

### minimatch.makeRe(pattern, options)

パターンから正規表現オブジェクトを作成します。

## Options

すべてのオプションはデフォルトで`false`です。

### debug

大量の情報を標準エラー出力にダンプします。

### nobrace

`{a,b}`や`{1..3}`のようなブレースセットを展開しません。

### noglobstar

複数のフォルダ名に対する`**`マッチングを無効にします。

### dot

パターンがピリオドで始まるファイル名にマッチすることを許可します。パターン内のその位置に明示的にピリオドがない場合でもマッチします。

注意: デフォルトでは、`dot`が設定されていない限り、`a/**/b`は`a/.d/b`に**マッチしません**。

### noext

`+(a|b)`のような"extglob"スタイルのパターンを無効にします。

### nocase

大文字小文字を区別しないマッチングを行います。

### nonull

`minimatch.match`でマッチが見つからない場合、このオプションが設定されていればパターン自体を含むリストを返します。設定されていない場合、マッチがなければ空のリストが返されます。

### matchBase

設定されている場合、スラッシュを含まないパターンは、パスにスラッシュが含まれていても、そのパスのベース名（basename）に対してマッチングされます。たとえば、`a?b`はパス`/xyz/123/acb`にマッチしますが、`/xyz/acb/123`にはマッチしません。

### nocomment

パターンの先頭の`#`をコメントとして扱う動作を抑制します。

### nonegate

先頭の`!`文字を否定として扱う動作を抑制します。

### flipNegate

否定式から、否定されていない場合と同じ結果を返します。（つまり、ヒットした場合はtrue、しなかった場合はfalseを返します。）

### partial

部分的なパスをパターンと比較します。パスの存在する部分がパターンと矛盾しない限り、マッチとして扱われます。これは、フォルダ構造を探索していて、まだ完全なパスを取得していないものの、絶対にマッチしないパスを探索しないようにしたいアプリケーションで便利です。

たとえば、

```js
minimatch('/a/b', '/a/*/c/d', { partial: true }) // true, /a/b/c/d になる可能性があるため
minimatch('/a/b', '/**/d', { partial: true }) // true, /a/b/.../d になる可能性があるため
minimatch('/x/y/z', '/a/**/z', { partial: true }) // false, x !== a であるため
```

### windowsPathsNoEscape

`\\`をパスセパレータとして**のみ**使用し、エスケープ文字としては**決して**使用しないようにします。設定されている場合、パターン内のすべての`\\`文字は`/`に置き換えられます。これにより、リテラルのglobパターン文字を含むパスに対するマッチングが**不可能**になることに注意してください。しかし、Windowsプラットフォーム上で`path.join()`や`path.resolve()`を使用して構築されたパターンとのマッチングが可能になり、Windows上の以前のバージョンの（バグのある！）動作を模倣します。注意して使用してください。

## License

MIT License — [LICENSE](LICENSE)を参照してください。
