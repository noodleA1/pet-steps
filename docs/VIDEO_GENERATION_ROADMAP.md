# Video Generation Roadmap

This document outlines the plan for implementing AI-powered video generation for pet animations using the Replicate API.

## Overview

Each pet needs three types of videos:
1. **Victory Animation** - Played when the pet wins a battle
2. **Defeat Animation** - Played when the pet loses a battle  
3. **Killing Blow Animation** - Played for the final attack that wins the battle

## Template Pet Videos Required

| Pet | Element | Victory | Defeat | Killing Blow |
|-----|---------|---------|--------|--------------|
| Fire Phoenix | Fire | ⬜ | ⬜ | ⬜ |
| Water Serpent | Water | ⬜ | ⬜ | ⬜ |
| Earth Golem | Earth | ⬜ | ⬜ | ⬜ |
| Air Spirit | Air | ⬜ | ⬜ | ⬜ |

## Replicate API Integration

### Recommended Models

1. **Stable Video Diffusion** (`stability-ai/stable-video-diffusion`)
   - Best for image-to-video generation
   - Takes a reference image and animates it
   - Good for consistent character appearance

2. **AnimateDiff** (`lucataco/animate-diff`)
   - Text-to-video with style control
   - Good for stylized game animations

3. **Kling** (if available)
   - High quality video generation
   - Better motion coherence

### Implementation Steps

#### 1. Set Up Replicate Client

```typescript
// server/replicate.ts
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function generatePetVideo(
  petImageUrl: string,
  animationType: 'victory' | 'defeat' | 'killing_blow'
): Promise<string> {
  const prompts = {
    victory: "celebrating, jumping with joy, happy dance, triumphant pose",
    defeat: "sad, drooping, disappointed, slumping down",
    killing_blow: "powerful attack, energy blast, dramatic strike, intense action"
  };

  const output = await replicate.run(
    "stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438",
    {
      input: {
        input_image: petImageUrl,
        motion_bucket_id: 127,
        fps: 24,
        num_frames: 25
      }
    }
  );

  return output as string;
}
```

#### 2. Add Video Generation Router

```typescript
// Add to server/routers.ts
import { generatePetVideo } from './replicate';

videoRouter.post('/generate', async (req, res) => {
  const { petImageUrl, animationType } = req.body;
  
  // Check subscription tier for video generation
  // Tier 1: 1 video set on evolution
  // Tier 2: 3 attempts
  // Tier 3: 10 attempts
  
  const videoUrl = await generatePetVideo(petImageUrl, animationType);
  res.json({ url: videoUrl });
});
```

#### 3. Token Costs

| Operation | Token Cost |
|-----------|------------|
| Victory Video | 3 tokens |
| Defeat Video | 3 tokens |
| Killing Blow Video | 3 tokens |
| Full Video Set | 9 tokens |

### Video Specifications

- **Duration**: 2-4 seconds per video
- **Resolution**: 512x512 or 768x768
- **Format**: MP4 with H.264 codec
- **Frame Rate**: 24 FPS
- **Background**: Green screen (#00FF00) for compositing

### Prompt Templates

#### Victory Animation
```
{pet_description} celebrating victory, jumping with joy, small celebratory effects, 
happy expression, wings/limbs raised triumphantly, solid green background #00FF00, 
game art style, smooth animation loop
```

#### Defeat Animation
```
{pet_description} looking defeated, sad expression, drooping posture, 
slowly slumping down, dejected body language, solid green background #00FF00,
game art style, smooth animation
```

#### Killing Blow Animation
```
{pet_description} performing powerful attack, {element}_based energy blast, 
dramatic action pose, intense expression, attack effects matching element type,
solid green background #00FF00, game art style, dynamic motion
```

### Element-Specific Effects

| Element | Victory Effect | Attack Effect |
|---------|---------------|---------------|
| Fire | Flames dancing around | Fire breath/explosion |
| Water | Water droplets splashing | Tidal wave/water jet |
| Earth | Rocks floating up | Boulder throw/earthquake |
| Air | Wind swirls | Tornado/lightning strike |

## Cost Estimation

Using Replicate's Stable Video Diffusion:
- ~$0.05 per video generation
- 12 videos for template pets = ~$0.60
- User-generated videos at scale need token system

## Environment Variables Required

```env
REPLICATE_API_TOKEN=r8_xxxxxxxxxxxxx
```

## Future Enhancements

1. **Video Caching** - Store generated videos in S3 to avoid regeneration
2. **Video Compositing** - Overlay videos on battle backgrounds
3. **Sound Effects** - Add audio to videos based on element type
4. **Dual Element Videos** - Special effects for pets with two elements
5. **3D Video** - For Tier 3 users, generate 3D animated videos

## Testing Checklist

- [ ] Replicate API connection working
- [ ] Victory video generation
- [ ] Defeat video generation
- [ ] Killing blow video generation
- [ ] Green screen background consistency
- [ ] Video playback in app
- [ ] Token deduction on generation
- [ ] Error handling for failed generations
- [ ] Video storage in S3
